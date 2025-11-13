"""
Keep-alive script to ensure services stay warm
Pings the backend API every 5 minutes to prevent cold starts
"""
import requests
import time
import os
from datetime import datetime

BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

def ping_backend():
    """Ping backend to keep it warm"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/content", timeout=10)
        status = "✅ OK" if response.status_code == 200 else f"⚠️ {response.status_code}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Backend ping: {status}")
        return True
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Backend ping failed: {str(e)}")
        return False

def main():
    """Main keep-alive loop"""
    print("🔥 Keep-alive service started")
    print(f"📡 Monitoring: {BACKEND_URL}")
    print("⏰ Ping interval: 5 minutes")
    print("-" * 50)
    
    while True:
        ping_backend()
        # Wait 5 minutes before next ping
        time.sleep(300)

if __name__ == "__main__":
    main()
