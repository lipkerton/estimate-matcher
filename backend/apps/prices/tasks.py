from celery import shared_task

from apps.prices.services.price_list_import import PriceListParserService


@shared_task
def parse_price_list_task(import_job_id: int) -> dict[str, int]:
    return PriceListParserService().parse(import_job_id)