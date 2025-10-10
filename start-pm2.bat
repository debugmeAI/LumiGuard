@echo off
echo Starting LumiGuard Backend...
timeout /t 15 /nobreak
cd C:\LumiGuard\backend
pm2 resurrect
pm2 save --force