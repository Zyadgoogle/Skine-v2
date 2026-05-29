# SkinE — Clinical Elite AI-Powered Skincare

SkinE is a high-end, clinical-grade skincare analysis platform that leverages advanced neural networks to map dermal topology and provide personalized skincare protocols.

![SkinE Hero](src/assets/aurora_serum.png)

## ✨ Key Features

- **Dermal Topology Analysis**: AI-powered skin scanning for hydration, texture, and elasticity.
- **Personalized Recommendations**: Scientifically curated AM/PM routines based on your unique biotype.
- **Clinical Dashboard**: Track your analysis history, dermal health scores, and progress.
- **Generative AI Visualization**: Engineering futuristic dermal models for predictive visualization (Coming Q3 2026).
- **Global Clinic Network**: Access professional consultations through our partner labs.
- **Midnight Clinical Aesthetic**: A premium, dark-themed interface designed for an elite user experience.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🛠️ Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Radwa09/SkinEwithdetected.git
   cd SkinEwithdetected
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🐍 Backend Setup (Python)

The AI vision features (Product Scanner & Face Capture) require the Python backend:

1. **Install Python dependencies**:
   ```bash
   pip install flask flask-cors opencv-python easyocr pyzbar numpy requests langchain-groq langchain-core pydantic
   ```

2. **Optional: enable live Groq AI chat and recommendations**:
   ```powershell
   $env:GROQ_API_KEY="your-valid-groq-api-key"
   ```
   If `GROQ_API_KEY` is missing or invalid, SkinE automatically uses local clinical fallback recommendations and chat instead of showing an API key error.

3. **Run the backend**:
   ```bash
   python backend_app.py
   ```

## 🌐 Deployment & Vercel Troubleshooting

If you are deploying to Vercel and see "Failed to fetch" or "Scanner Error":

1. **Backend URL**: By default, the app looks for the backend at `http://localhost:5000`. If your backend is hosted elsewhere (e.g., Render, Railway), set the `VITE_BACKEND_URL` environment variable in Vercel.
2. **Mixed Content**: Vercel uses HTTPS. If your backend is only HTTP (like a local server), most browsers will block the connection. You must host your backend on an HTTPS-enabled server.
3. **Local Testing**: To test with the backend while the frontend is on Vercel, use a tool like **Ngrok** to create an HTTPS tunnel to your local port 5000 and set that as `VITE_BACKEND_URL`.

---
*Engineering the future of digital dermatology.*
