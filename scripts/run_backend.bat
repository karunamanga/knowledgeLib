@echo off
echo ========================================================
echo Starting Organisation Portal - FastAPI Backend Server
echo ========================================================
cd ..\Backend
python -m app.core.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
