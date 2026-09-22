@echo off
title Databricks Study Lab
cd /d "%~dp0app"
echo Iniciando Databricks Study Lab en http://localhost:8765/app/index.html
echo Cierra esta ventana para apagar la app.
start "" http://localhost:8765/app/index.html
python server.py
