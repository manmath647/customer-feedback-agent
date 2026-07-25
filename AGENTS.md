# AGENTS.md

## Project overview
Customer Feedback Analysis Agent — a phased sentiment analysis 
system. Starts with a classical ML baseline (Phase 1), upgrades to 
a fine-tuned transformer for aspect-based sentiment (Phase 2), and 
adds an LLM fallback for low-confidence cases (Phase 3).

## Architecture
- `src/ingestion/` — loads raw review data
- `src/preprocessing/` — cleaning, deduplication, EDA utilities
- `src/models/` — Phase 1 logistic regression baseline; 
  Phase 2 fine-tuned transformer added here alongside it
- `src/agent/` — not yet in use; Phase 3 will hold the 
  confidence router and LLM fallback logic here
- `src/api/` — FastAPI app
  - `main.py` — app entrypoint
  - `routes/` — API endpoint definitions
  - `templates/` — Jinja2 HTML templates for the dashboard
  - `static/css/`, `static/js/` — dashboard styling and 
    client-side logic (charts, etc.)
- `data/raw/` — untouched source data, never overwritten
- `data/processed/` — cleaned output
- `tests/` — test suite

## Conventions
- Python 3.x, type hints on function signatures
- All secrets/config in `.env`, never hardcoded, never committed
- `requirements.txt` kept pinned via `pip freeze` after installs
- Every folder maps to a pipeline stage, not a phase — new 
  capability gets added as files inside existing folders

## Roadmap
**Phase 1 (current)** — ingestion, cleaning, logistic regression 
sentiment classifier (positive/negative/neutral), visualizations

**Phase 2** — fine-tuned transformer for aspect-based sentiment

**Phase 3** — confidence router + LLM fallback for low-confidence cases

## Current stage
Project structure, virtual environment, git/GitHub setup complete. 
Starting Phase 1 ingestion stage next.

## Commands
- Run API: (to be filled in once it exists)
- Run tests: (to be filled in once it exists)