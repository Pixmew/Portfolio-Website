@echo off
echo Building Projects List...
powershell -ExecutionPolicy Bypass -File "%~dp0build_projects.ps1"
echo Done!
pause
