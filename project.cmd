@echo off
bun "%~dp0scripts\project.mjs" %*
exit /b %errorlevel%
