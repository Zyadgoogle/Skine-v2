import requests
import base64
import json
import os

# Test a known barcode from the database
TEST_BARCODE = "3337872411083" # La Roche-Posay Effaclar
BACKEND_URL = "http://localhost:5000"

def test_health():
    print(f"Checking health at {BACKEND_URL}/api/health...")
    try:
        resp = requests.get(f"{BACKEND_URL}/api/health")
        print(f"Health Response: {resp.status_code}")
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print(f"Health check failed: {e}")

def test_scan_dummy():
    print(f"\nTesting scan-product at {BACKEND_URL}/api/scan-product...")
    # We don't have a real image of a barcode here, but we can test if the endpoint is reachable
    # and if it handles invalid data correctly.
    try:
        # Sending a tiny black square as base64
        dummy_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        resp = requests.post(
            f"{BACKEND_URL}/api/scan-product",
            json={"image": dummy_image}
        )
        print(f"Scan Response: {resp.status_code}")
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print(f"Scan test failed: {e}")

if __name__ == "__main__":
    print("=== SkinE Backend Test Script ===")
    test_health()
    test_scan_dummy()
    print("\nNote: To test actual barcode recognition, the backend must be running.")
