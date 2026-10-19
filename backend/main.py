import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import settings
from backend.routes import (
    auth,
    tasks,
    courses,
    study,
    routine,
    habits,
    sleep,
    gym,
    goals,
    analytics
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade Dark Study OS / Personal Productivity Dashboard Backend"
)

# Enable CORS for development & API consumption
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(courses.router)
app.include_router(study.router)
app.include_router(routine.router)
app.include_router(habits.router)
app.include_router(sleep.router)
app.include_router(gym.router)
app.include_router(goals.router)
app.include_router(analytics.router)

# Health & Status Endpoint
@app.get("/api/health")
def health_check():
    from backend.database.supabase import is_supabase_configured
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "supabase_connected": is_supabase_configured()
    }

# Mount Frontend static files
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.exists():
    css_dir = frontend_dir / "css"
    js_dir = frontend_dir / "js"
    if css_dir.exists():
        app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
    if js_dir.exists():
        app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")

    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    # Serve dashboard.html directly at root without login
    @app.get("/")
    def serve_index():
        return FileResponse(str(frontend_dir / "dashboard.html"))

    @app.get("/index.html")
    def serve_index_html():
        return FileResponse(str(frontend_dir / "dashboard.html"))

    @app.get("/{page_name}.html")
    def serve_html_page(page_name: str):
        if page_name in ("index", "login"):
            return FileResponse(str(frontend_dir / "dashboard.html"))
        target = frontend_dir / f"{page_name}.html"
        if target.exists():
            return FileResponse(str(target))
        return FileResponse(str(frontend_dir / "dashboard.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)

