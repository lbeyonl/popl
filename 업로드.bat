@echo off
echo Uploading to GitHub... Please wait!
echo.

set PATH=%PATH%;C:\Program Files\Git\cmd

git add .
git commit -m "Update website"
git push origin master

echo.
echo ==========================================================
echo Upload Complete! 
echo Wait 1-5 minutes for the changes to apply online.
echo ==========================================================
pause
