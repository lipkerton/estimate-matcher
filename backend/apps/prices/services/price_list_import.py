import re
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.utils import timezone

from apps.imports.dtos import ExcelRow
from apps.imports.exceptions import InvalidColumnMappingError
from apps.imports.models import ImportFile, ImportJob
from apps.imports.services.excel_reader import ExcelRowReader
from apps.prices.models import PriceList, SupplierPriceItem
from apps.suppliers.models import Supplier


class PriceListImportStarter:
    def create_import(
        self,
        supplier: Supplier,
        import_file: ImportFile,
        column_mapping: dict[str, Any],
        name: str = "",
    ) -> PriceList:
        self._validate_mapping(column_mapping)

        with transaction.atomic():
            import_job = ImportJob.objects.create(
                import_type=ImportJob.ImportType.PRICE_LIST,
                status=ImportJob.Status.PENDING,
                import_file=import_file,
                column_mapping=column_mapping,
            )
            return PriceList.objects.create(
                supplier=supplier,
                import_job=import_job,
                name=name
            )
        
        def _validate_mapping(self, mapping: dict[str, Any]) -> None:
            required_fields = ("name", "price")

            for field in required_fields:
                if field not in mapping:
                    raise InvalidColumnMappingError(
                        f"Column mapping must contain '{field}'."
                    )
            
            index_fields = ("sku", "name", "unit", "price", "start_row")

            for field in index_fields:
                if field not in mapping:
                    continue
                
                value = mapping[field]

                if not isinstance(value, int):
                    raise InvalidColumnMappingError(
                        f"Column mapping field '{field}' must be integer."
                    )
                
                if value < 0:
                    raise InvalidColumnMappingError(
                        f"Column mapping field '{field}' cannot be negative."
                    )


class PriceListParserService:
    PROGRESS_UPDATE_EVERY = 100

    def __init__(self, row_reader: ExcelRowReader | None = None) -> None:
        self.row_reader = row_reader or ExcelRowReader()
    
    def parse(self, import_job_id: int) -> dict[str, int]:
        import_job = ImportJob.objects.select_related("import_file").get(
            id=import_job_id,
        )
        price_list = import_job.price_list

        mapping = import_job.column_mapping
        PriceListImportStarter()._validate_mapping(mapping)

        file_path = import_job.import_file.file.path
        sheet_name = mapping.get("sheet_name") or None
        start_row = mapping.get("start_row", 1)

        self._mark_processing(import_job)

        try:
            total_rows = max(
                self.row_reader.get_total_rows(file_path, sheet_name) - start_row,
                0,
            )
            self._set_total_rows(import_job, total_rows)

            items_to_create: list[SupplierPriceItem] = list()
            processed_rows = 0

            for excel_row in self.row_reader.iter_rows(
                file_path=file_path,
                sheet_name=sheet_name,
                start_row=start_row,
            ):
                processed_rows += 1

                item = self._build_price_item(
                    price_list=price_list,
                    excel_row=excel_row,
                    mapping=mapping,
                )

                if item is not None:
                    items_to_create.append(item)

                if processed_rows % self.PROGRESS_UPDATE_EVERY == 0:
                    self._update_progress(import_job, processed_rows, total_rows)

            with transaction.atomic():
                price_list.items.all().delete()
                SupplierPriceItem.objects.bulk_create(
                    items_to_create,
                    batch_size=1000,
                )

            self._mark_success(import_job, processed_rows, total_rows)

            return {
                "processed_rows": processed_rows,
                "created_items": len(items_to_create),
            }

        except Exception as exc:
            self._mark_failed(import_job, str(exc))
            raise

    def _build_price_item(
        self,
        price_list: PriceList,
        excel_row: ExcelRow,
        mapping: dict[str, Any],
    ) -> SupplierPriceItem | None:
        values = excel_row.values

        supplier_name = self._get_string_value(values, mapping["name"])

        if not supplier_name:
            return None

        supplier_sku = self._get_string_value(values, mapping.get("sku"))
        unit = self._get_string_value(values, mapping.get("unit"))
        price = self._get_decimal_value(values, mapping["price"])

        raw_row = {
            str(index): value
            for index, value in enumerate(values)
        }

        return SupplierPriceItem(
            price_list=price_list,
            supplier_sku=supplier_sku,
            supplier_name=supplier_name,
            unit=unit,
            price=price,
            raw_row=raw_row,
            row_number=excel_row.row_number,
        )

    def _get_value(self, values: list[Any], index: int | None) -> Any:
        if index is None:
            return None

        if index >= len(values):
            return None

        return values[index]

    def _get_string_value(self, values: list[Any], index: int | None) -> str:
        value = self._get_value(values, index)

        if value is None:
            return ""

        return str(value).strip()

    def _get_decimal_value(self, values: list[Any], index: int) -> Decimal:
        value = self._get_value(values, index)

        if value is None or value == "":
            return Decimal("0")

        if isinstance(value, int | float | Decimal):
            return Decimal(str(value))

        normalized = str(value).strip()
        normalized = normalized.replace(" ", "")
        normalized = normalized.replace(",", ".")

        normalized = re.sub(r"[^0-9.\-]", "", normalized)

        if not normalized:
            return Decimal("0")

        try:
            return Decimal(normalized)
        except InvalidOperation as exc:
            raise ValueError(f"Invalid decimal value: {value}") from exc

    def _mark_processing(self, import_job: ImportJob) -> None:
        ImportJob.objects.filter(id=import_job.id).update(
            status=ImportJob.Status.PROCESSING,
            started_at=timezone.now(),
            error_message="",
            progress=0,
            processed_rows=0,
        )

    def _set_total_rows(self, import_job: ImportJob, total_rows: int) -> None:
        ImportJob.objects.filter(id=import_job.id).update(
            total_rows=total_rows,
        )

    def _update_progress(
        self,
        import_job: ImportJob,
        processed_rows: int,
        total_rows: int,
    ) -> None:
        progress = self._calculate_progress(processed_rows, total_rows)

        ImportJob.objects.filter(id=import_job.id).update(
            processed_rows=processed_rows,
            progress=progress,
        )

    def _mark_success(
        self,
        import_job: ImportJob,
        processed_rows: int,
        total_rows: int,
    ) -> None:
        ImportJob.objects.filter(id=import_job.id).update(
            status=ImportJob.Status.SUCCESS,
            processed_rows=processed_rows,
            progress=self._calculate_progress(processed_rows, total_rows),
            finished_at=timezone.now(),
        )

    def _mark_failed(self, import_job: ImportJob, error_message: str) -> None:
        ImportJob.objects.filter(id=import_job.id).update(
            status=ImportJob.Status.FAILED,
            error_message=error_message,
            finished_at=timezone.now(),
        )

    def _calculate_progress(self, processed_rows: int, total_rows: int) -> int:
        if total_rows <= 0:
            return 100

        return min(int(processed_rows / total_rows * 100), 100)