#!/usr/bin/env python3
"""
Keep-alive script to ensure services stay warm
Pings the backend API every 5 minutes to prevent cold starts
"""
import subprocess
import time
from datetime import datetime

BACKEND_URL = "https://media-unifier.preview.emergentagent.com"

def ping_backend():
    """Ping backend to keep it warm using curl"""
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', f'{BACKEND_URL}/api/content'],
            capture_output=True,
            text=True,
            timeout=15
        )
        status_code = result.stdout.strip()
        status = "✅ OK" if status_code == "200" else f"⚠️ {status_code}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Backend ping: {status}")
        return status_code == "200"
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Backend ping failed: {str(e)}")
        return False

def main():
    """Main keep-alive loop"""
    print("🔥 Keep-alive service started")
    print(f"📡 Monitoring: {BACKEND_URL}")
    print("⏰ Ping interval: 4 minutes")
    print("-" * 50)
    
    while True:
        ping_backend()
        # Wait 4 minutes before next ping (240 seconds)
        time.sleep(240)

if __name__ == "__main__":
    main()
