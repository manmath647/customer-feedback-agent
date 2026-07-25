# Customer Feedback Analysis Agent

An agentic pipeline that ingests customer reviews from multiple sources, 
cleans and analyzes them, and escalates ambiguous cases to an LLM for 
deeper aspect-based sentiment analysis — built to be cost-aware rather 
than routing every review through an expensive model.

## Status
🚧 In active development. Currently: project structure, environment, 
and tooling set up. Core pipeline stages coming next.

## Architecture
1. **Ingestion** — load reviews from multiple sources
2. **Preprocessing** — cleaning, deduplication, EDA
3. **Classical ML baseline** — fast sentiment/aspect tagging on all reviews
4. **Confidence router** — escalates only ambiguous cases to the LLM tier
5. **LLM analysis** — deeper aspect-based sentiment with cited evidence
6. **Dashboard** — sentiment trends, escalation feed, review insights

## Tech Stack
- **Backend**: Python, FastAPI
- **Data**: Pandas, Supabase (Postgres)
- **ML**: scikit-learn, sentence-transformers
- **LLM**: [provider TBD]
- **Frontend**: HTML/CSS/JS served via FastAPI
- **Infra**: Docker

## Setup
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Project Structure
See `AGENTS.md` for architecture details and current build stage.