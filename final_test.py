import requests
import base64
import os
import cv2
import numpy as np

def generate_test_image():
    img = np.zeros((240, 320, 3), dtype=np.uint8)
    cv2.putText(img, "TEST", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def test_endpoints():
    base_url = "http://127.0.0.1:5000"
    image_data = generate_test_image()
    
    print("Testing /api/health...")
    try:
        resp = requests.get(f"{base_url}/api/health")
        print(f"Health Status: {resp.status_code}, Response: {resp.json()}")
    except Exception as e:
        print(f"Health Error: {e}")

    print("\nTesting /api/detect-face...")
    try:
        resp = requests.post(f"{base_url}/api/detect-face", json={"image": image_data})
        print(f"Detect Status: {resp.status_code}")
        print(f"Detect Response: {resp.text}")
    except Exception as e:
        print(f"Detect Error: {e}")

    print("\nTesting /api/upload-face...")
    try:
        resp = requests.post(f"{base_url}/api/upload-face", json={"image": image_data})
        print(f"Upload Status: {resp.status_code}")
        print(f"Upload Response: {resp.text}")
    except Exception as e:
        print(f"Upload Error: {e}")

if __name__ == "__main__":
    test_endpoints()
