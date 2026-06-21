class ImportDomainError(Exception):
    """Base exception for import domain errors."""


class ExcelPreviewError(ImportDomainError):
    """Raised when Excel preview cannot be created."""


class ExcelReadError(ImportDomainError):
    """Raised when Excel file cannot be read."""


class InvalidColumnMappingError(ImportDomainError):
    """Raised when column mapping is invalid."""