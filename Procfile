web: gunicorn -w 2 -k uvicorn.workers.UvicornWorker src.api.main:app --bind 0.0.0.0:$PORT --timeout 120 --log-level info
