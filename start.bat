@echo off
cd /d "%~dp0"
echo Opening http://localhost:5500 ...
npx --yes http-server -p 5500 -c-1 -o
