import cv2
import requests
import json
import os

SERVER_URL = "http://127.0.0.1:5000/predict"
CHAT_URL = "http://127.0.0.1:5000/chat"

def start_chat_loop():
    print("\n💬 Chat with SkinE (Type 'exit' to quit or 'new' for a new scan)")
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ['exit', 'quit']:
            print("Goodbye!")
            exit()
        elif user_input.lower() == 'new':
            return 
        if not user_input:
            continue
        try:
            response = requests.post(CHAT_URL, json={"message": user_input})
            if response.status_code == 200:
                reply = response.json().get("reply", "No reply received.")
                print(f"\n✨ SkinE: {reply}\n")
            else:
                print(f"❌ Chat Error: {response.text}")
        except Exception as e:
            print(f"❌ Connection error during chat: {e}")

# --- NEW: Question flow ---
def ask_questions():
    """Asks pre-analysis questions and handles redirects."""
    print("\n" + "-"*40)
    print("📋 Pre-Analysis Questionnaire")
    print("-"*40)
    
    disease = input("1. Do you have a diagnosed skin disease? (yes/no): ").strip().lower()
    if disease in ['yes', 'y']:
        print("\n🩺 AI cannot replace a medical professional.")
        print("➡️  Redirecting you to our specialists: www.yoursite.com/dermatologists")
        return None # Returning None stops the flow!
        
    condition = input("2. Do you suffer from acne or specific sensitivities? (Type them or press Enter for none): ").strip()
    if not condition:
        condition = "no condition detected"
        
    return condition
# --------------------------

# --- MODIFIED: Accepts the 'condition' variable ---
def send_to_server(image_path, condition):
    print(f"\n⏳ Sending '{image_path}' to AI Server...")
    try:
        with open(image_path, "rb") as img_file:
            # We now send BOTH the image and the text data (condition)
            response = requests.post(SERVER_URL, files={"image": img_file}, data={"condition": condition})
        
        if response.status_code == 200:
            data = response.json()
            recs = data.get("recommendations", {})
            
            print("\n" + "="*50)
            print(" ✨ AI SKIN ANALYSIS COMPLETE ✨")
            print("="*50)
            print(f"🧬 Predicted Skin Type : {data.get('skin_type')}")
            print(f"📝 Summary             : {recs.get('summary')}")
            
            print("\n🌅 MORNING ROUTINE:")
            for step in recs.get('daily_routine', {}).get('morning', []):
                print(f"  • {step}")
            print("\n🌙 EVENING ROUTINE:")
            for step in recs.get('daily_routine', {}).get('evening', []):
                print(f"  • {step}")
                
            print("\n🛒 AFFORDABLE PRODUCTS (Drugstore/Budget):")
            for prod in recs.get('products', {}).get('affordable', []):
                print(f"  • {prod}")
            print("\n💎 HIGH-END PRODUCTS (Luxury/Premium):")
            for prod in recs.get('products', {}).get('high_end', []):
                print(f"  • {prod}")
                
            print("\n⚠️ INGREDIENTS TO AVOID:")
            for ing in recs.get('ingredients', {}).get('avoid', []):
                print(f"  • {ing}")
            print("\n💡 LIFESTYLE TIPS:")
            for tip in recs.get('lifestyle_tips', []):
                print(f"  • {tip}")
            print("="*50 + "\n")

            start_chat_loop()
        else:
            print(f"\n❌ Server Error: {response.text}")
    except Exception as e:
        print(f"❌ Connection failed. Is app.py running? Error: {e}")

def take_photo():
    print("\n📷 Opening camera... (Press SPACEBAR to capture, or 'q' to quit)")
    cap = cv2.VideoCapture(0)
    temp_filename = "temp_capture.jpg"
    while True:
        ret, frame = cap.read()
        if not ret: break
        cv2.imshow("Test Camera - Press SPACE to capture", frame)
        key = cv2.waitKey(1)
        if key == 32: 
            cv2.imwrite(temp_filename, frame)
            print("✅ Photo snapped!")
            break
        elif key == ord('q'):
            cap.release()
            cv2.destroyAllWindows()
            return None
    cap.release()
    cv2.destroyAllWindows()
    return temp_filename

def main():
    while True:
        print("\n" + "═"*40)
        print("       SkinE AI - Client Tester       ")
        print("═"*40)
        print("How would you like to provide a photo?")
        print("1. 📷 Take a new photo with Web Camera")
        print("2. 📁 Upload an existing image file")
        print("3. ❌ Quit")
        
        choice = input("\nEnter 1, 2, or 3: ").strip()
        
        if choice == '1':
            condition = ask_questions()
            # Only proceed to photo if they didn't trigger the disease redirect
            if condition: 
                img_path = take_photo()
                if img_path: send_to_server(img_path, condition)
        elif choice == '2':
            condition = ask_questions()
            if condition:
                print("\nMake sure your image is in the SkinE folder!")
                img_path = input("Enter the file name (e.g., face.jpg): ").strip()
                if os.path.exists(img_path):
                    send_to_server(img_path, condition)
                else:
                    print(f"\n❌ Error: Could not find '{img_path}'.")
        elif choice == '3':
            break
        else:
            print("\n❌ Invalid choice.")

if __name__ == "__main__":
    main()