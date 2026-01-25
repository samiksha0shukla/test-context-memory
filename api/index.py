import sys
import os

# Add the backend directory to sys.path so that imports within backend/main.py work
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

try:
    from main import app
except Exception as e:
    import traceback
    import sys
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    print(f"STARTUP ERROR: {traceback.format_exc()}")
    
    # Create a fallback app to report the error
    app = FastAPI()
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def catch_all(path_name: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Application failed to start",
                "detail": str(e),
                "traceback": traceback.format_exc().splitlines()
            }
        )
