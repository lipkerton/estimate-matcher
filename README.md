# Estimate Matcher

Hi!

The story is simple: I was asked by a corporation to build a full-stack test assignment around a very real business problem — importing supplier price lists and project estimates from Excel files, then matching estimate positions with products from an internal catalog.

So I took that task and turned it into a proper training / portfolio project.

This is not just another CRUD app with five sad tables and a login button nobody asked for. The project has file uploads, Excel preview, background processing, import jobs, matching logic, optional local LLM reranking, and manual human verification.

Basically:

```text
Excel chaos goes in.
Some structured data comes out.
Then the algorithm tries to match things.
Then a human can fix what the algorithm confidently misunderstood.
```

## What it does

The app allows you to:

* manage suppliers;
* manage a normalized product catalog;
* create projects;
* upload Excel files;
* preview Excel files before importing them;
* import supplier price lists;
* import project estimates;
* track background import jobs;
* run deterministic matching by SKU and fuzzy name similarity;
* optionally run local LLM reranking with Ollama;
* manually verify matching results;
* assign products manually;
* mark items as `no_match`;
* reset matching results.

The main workflow looks like this:

```text
upload Excel file
→ preview it
→ import price list or estimate
→ process rows in Celery
→ run matching
→ optionally run LLM rerank
→ manually verify the result
```

## Requirements

You need:

* Python 3.12+
* Poetry
* Node.js 20+
* npm
* Docker
* Docker Compose

The project uses:

### Backend

* Django
* Django REST Framework
* PostgreSQL
* Redis
* Celery
* drf-spectacular / Swagger
* openpyxl / xlrd
* rapidfuzz
* httpx
* pydantic-settings

### Frontend

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* Axios

### Infrastructure

* PostgreSQL in Docker
* Redis in Docker
* Ollama in Docker, optional, for local LLM reranking

## Setup

Clone the repository:

```bash
git clone https://github.com/lipkerton/estimate-matcher.git
cd estimate-matcher
```

Create project-level environment file:
```bash
cp .env.example .env
```

Create frontend environment file:
```bash
echo "VITE_API_BASE_URL=http://127.0.0.1:8000/api" > frontend/.env
```

Start infrastructure:

```bash
docker compose up -d db redis ollama
```

This starts:

```text
PostgreSQL → localhost:5432
Redis      → localhost:6379
Ollama     → localhost:11434
```

You can check containers with:

```bash
docker compose ps
```

## Backend

Go to backend directory:

```bash
cd backend
```

Install dependencies:

```bash
poetry install
```

Apply migrations:

```bash
poetry run python manage.py migrate
```

Run Django:

```bash
poetry run python manage.py runserver
```

Backend will be available at:

```text
http://127.0.0.1:8000
```

Swagger docs:

```text
http://127.0.0.1:8000/api/docs/
```

Run Celery worker in another terminal:

```bash
cd backend
poetry run celery -A config worker -l info
```

Celery is required for Excel imports.

If you import a price list or estimate and nothing appears in the rows table, there is a 90% chance that Celery is not running. The other 10% is reserved for traditional developer suffering.

Useful backend commands:

```bash
poetry run python manage.py check
poetry run ruff check .
poetry run ruff format .
```

## Frontend

Go to frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Frontend will be available at:

```text
http://localhost:5173
```

Main pages:

```text
/suppliers      suppliers
/products       normalized product catalog
/projects       projects
/import-files   Excel upload and preview
/price-lists    price list import
/estimates      estimate import, matching, LLM rerank, manual verification
/import-jobs    background import job statuses
```

Useful frontend commands:

```bash
npm run build
npm run lint
```

## Optional LLM reranking

LLM reranking is optional. The project works without it.

By default, you can keep:

```env
LLM_ENABLED=False
```

If you want to try local LLM reranking with Ollama, pull the model:

```bash
docker exec -it estimate_matcher_ollama ollama pull deepseek-r1:1.5b
```

Then set in `.env`:

```env
LLM_ENABLED=True
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=deepseek-r1:1.5b
```

Restart Django and Celery after changing `.env`.

Important note: the LLM does not search the whole catalog. It only reranks already generated deterministic candidates. So the LLM is not the hero of the story; it is more like a slightly overconfident assistant who is allowed to choose only from a prepared shortlist.

## Demo flow

A simple way to test the app:

1. Create catalog products on `/products`.
2. Create a supplier on `/suppliers`.
3. Create a project on `/projects`.
4. Upload Excel files on `/import-files`.
5. Preview the uploaded files.
6. Import a supplier price list on `/price-lists`.
7. Import an estimate on `/estimates`.
8. Check background jobs on `/import-jobs`.
9. Run `Match` for the estimate.
10. Optionally run `LLM rerank`.
11. Manually verify results:

    * set product;
    * mark no match;
    * reset matching.

The intended workflow is:

```text
deterministic matching
→ optional LLM rerank
→ human verification
```

Because, as always, automation is great right until it decides that a cable and a circuit breaker are spiritually similar.
