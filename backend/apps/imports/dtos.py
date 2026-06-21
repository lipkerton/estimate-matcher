from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ExcelPreview:
    sheet_name: str
    sheet_names: list[str]
    rows: list[list[Any]]


@dataclass(frozen=True)
class ExcelRow:
    row_number: int
    values: list[Any]
