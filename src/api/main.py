from fastapi import FastAPI

app = FastAPI(title = " Customer Feedback Analysis Agent")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "API is running"}
