from config.celery import app


@app.task
def debug_task() -> str:
    return "Celery works"
