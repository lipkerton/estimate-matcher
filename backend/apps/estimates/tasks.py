from celery import shared_task

from apps.estimates.services.estimate_import import EstimateParserService


@shared_task
def parse_estimate_task(import_job_id: int) -> dict[str, int]:
    return EstimateParserService().parse(import_job_id)
