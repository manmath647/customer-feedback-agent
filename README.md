# Customer Feedback Analysis Agent

A system for analyzing customer reviews and surfacing sentiment 
insights through an interactive dashboard.

## Overview
This project ingests customer reviews, cleans and processes the 
data, classifies sentiment using machine learning, and visualizes 
the results — helping identify patterns in customer feedback at scale.

## Tech Stack
- **Backend**: Python, FastAPI
- **Data Processing**: Pandas
- **Machine Learning**: scikit-learn
- **Frontend**: HTML, CSS, JavaScript
- **Infra**: Docker

## Setup
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Project Structure
```
src/
├── ingestion/      # Loading raw review data
├── preprocessing/  # Cleaning and data preparation
├── models/         # ML models for sentiment classification
├── agent/          # Analysis and decision logic
└── api/            # FastAPI backend + dashboard
```