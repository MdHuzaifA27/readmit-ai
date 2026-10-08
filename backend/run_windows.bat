@echo off
cd /d %~dp0
python -m pip install -r requirements.txt
python train_model.py
python -m uvicorn main:app --reload --port 8000
