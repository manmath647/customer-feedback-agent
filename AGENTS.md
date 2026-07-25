# AGENTS.md

## Project overview
Customer Feedback Analysis Agent — ingests customer reviews, cleans 
them, runs a fast classical ML sentiment/aspect baseline on all of 
them, and escalates only low-confidence/ambiguous cases to an LLM 
for deeper aspect-based sentiment analysis. Results surface on a 
dashboard.

## Architecture
- `src/ingestion/` — loads raw review data from multiple sources
- `src/preprocessing/` — cleaning, deduplication, EDA utilities
- `src/models/` — classical ML baseline, embeddings
- `src/agent/` — confidence router + LLM analysis logic
- `src/api/` — FastAPI app
  - `main.py` — app entrypoint
  - `routes/` — API endpoint definitions
  - `templates/` — Jinja2 HTML templates for the dashboard
  - `static/css/`, `static/js/` — dashboard styling and client-side logic
- `data/raw/` — untouched source data, never overwritten
- `data/processed/` — cleaned output
- `tests/` — test suite

## Conventions
- Python 3.x, type hints on function signatures
- All secrets/config in `.env`, never hardcoded, never committed
- `requirements.txt` kept pinned via `pip freeze` after installs
- Every folder maps to a pipeline stage, not a version/feature

## Current stage
Project structure, virtual environment, git/GitHub setup complete. 
Starting ingestion stage next.

## Commands
- Run API: (to be filled in once it exists)
- Run tests: (to be filled in once it exists)