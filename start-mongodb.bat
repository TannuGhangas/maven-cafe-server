@echo off
echo Starting MongoDB Connection Fix...
echo ==================================
echo.

REM Check if MongoDB service is running
echo Checking MongoDB service status...
sc query MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo MongoDB service found, checking status...
    sc query MongoDB | find "RUNNING" >nul
    if %errorlevel% == 0 (
        echo ✅ MongoDB service is already running!
        echo.
        echo You can now start your server:
        echo cd maven-cafe-server
        echo npm start
        goto :end
    ) else (
        echo MongoDB service is installed but not running.
        echo Starting MongoDB service...
        net start MongoDB
        if %errorlevel% == 0 (
            echo ✅ MongoDB service started successfully!
            echo.
            echo You can now start your server:
            echo cd maven-cafe-server
            echo npm start
        ) else (
            echo ❌ Failed to start MongoDB service.
            echo Please run this script as Administrator.
        )
        goto :end
    )
) else (
    echo ❌ MongoDB service not found.
    echo.
    echo Please choose one of the following options:
    echo.
    echo 1. Install MongoDB Community Edition
    echo    Visit: https://www.mongodb.com/try/download/community
    echo.
    echo 2. Use the MongoDB fix script
    echo    Run: node mongodb-fix.js
    echo.
    echo 3. Use Docker MongoDB (if Docker is installed)
    echo    Run: docker run -d -p 27017:27017 --name mongodb mongo:latest
    echo.
    echo 4. Set up MongoDB Atlas (Cloud)
    echo    Visit: https://cloud.mongodb.com/
)

:end
echo.
echo Press any key to exit...
pause >nul