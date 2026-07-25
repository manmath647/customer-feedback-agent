# Customer Feedback Analysis Agent

A phased system for analyzing customer reviews — starting with a 
fast classical ML sentiment classifier and visual dashboard, then 
progressively adding aspect-based sentiment via a fine-tuned 
transformer, and finally an LLM fallback for cases the transformer 
can't confidently handle.

## Status
🚧 In active development — Phase 1 in progress.

## Roadmap

**Phase 1 (current)**
- Ingest and clean review data
- Logistic regression model classifying each review as 
  positive / negative / neutral
- Visualizations of sentiment distribution and trends

**Phase 2**
- Replace/augment the baseline with a fine-tuned transformer 
  for aspect-based sentiment analysis (e.g. battery: negative, 
  price: positive, within the same review)

**Phase 3**
- Confidence-based routing: escalate cases the transformer 
  can't confidently classify to an LLM fallback

## Tech Stack
- **Backend**: Python, FastAPI
- **Data**: Pandas
- **ML**: scikit-learn (Phase 1), HuggingFace Transformers (Phase 2)
- **LLM**: [provider TBD] (Phase 3)
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