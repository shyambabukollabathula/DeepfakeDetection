# ✨ Deepfake Detection: A Computer Vision Approach for Identifying Synthetic Media

[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/frontend-React-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![PyTorch](https://img.shields.io/badge/ML-PyTorch-ee4c2c?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![OpenCV](https://img.shields.io/badge/CV-OpenCV-5C3EE8?logo=opencv&logoColor=white)](https://opencv.org/)
[![License](https://img.shields.io/github/license/shyambabukollabathula/DeepfakeDetection?color=blue)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg?style=flat)](https://github.com/shyambabukollabathula/DeepfakeDetection/pulls)

---

## 🌟 Overview

**DeepfakeDetection** is a modern, AI-powered web application that helps you identify synthetic (deepfake) images and videos.  
It features a beautiful, animated UI with a one-tap dark/light mode and a unique splitting animation, making the experience both powerful and delightful.

---

## 🛠️ Technologies Used

- **Frontend:** React, TypeScript, Vite, CSS-in-JS
- **Backend:** FastAPI, SQLAlchemy, Pydantic, JWT Authentication
- **AI/ML:** PyTorch, timm, EfficientNet, OpenCV
- **Database:** SQLite

---

## 🚀 How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/shyambabukollabathula/DeepfakeDetection.git
cd DeepfakeDetection
```

### 2. Backend Setup

```bash
cd deepfake_detection
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
# Place your model weights (e.g., df_model1.pth) in deepfake_detection/weights/
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- The frontend will run on [http://localhost:5173](http://localhost:5173) by default.
- The backend runs on [http://localhost:8000](http://localhost:8000).

---

## 🧠 How the AI/ML Model & Animations Work

- **Upload:** You upload an image or video.
- **Preprocessing:** The backend extracts frames (for videos) and prepares the data.
- **Prediction:**  
  - The EfficientNet-based deep learning model analyzes the content for deepfake artifacts.
  - It outputs a confidence score for “real” or “deepfake.”
- **Result:**  
  - The app displays the result and confidence.
  - Your detection history is saved for your account.
- **UI Animations:**  
  - The app features a one-tap theme switch (☀️/🌙).
  - When you change the theme, a stunning splitting (circular reveal) animation radiates from the button, smoothly transitioning the background and UI colors.
  - The design uses glassmorphism, 3D floating panels, and modern gradients for a futuristic look.

---

## 🔒 Security & Privacy

- **Authentication:** Secure JWT-based login and registration.
- **File Privacy:** Your uploads and results are private to your account.
- **No Third-Party Sharing:** Your data is never shared or sold.
- **History Control:** You can clear your detection history at any time.
- **Open Source:** Review the code to see how your data is handled.

---

## ❓ FAQ

**Q: What is a deepfake?**  
A: A synthetic image or video created using AI to swap or alter faces/voices.

**Q: Is my data safe?**  
A: Yes! All uploads are private and only accessible to you.

**Q: Can I use my own AI model?**  
A: Yes! Swap out the model weights or code in `deepfake_detector.py`.

**Q: Does it work on mobile?**  
A: Absolutely! The UI is fully responsive.

**Q: What file types are supported?**  
A: JPG, PNG, MP4, AVI, MOV.

---

## 🐞 Troubleshooting

- **Frontend not connecting to backend?**  
  - Make sure the backend is running on port 8000 and CORS is enabled.
- **Model not loading?**  
  - Ensure your weights file (e.g., `df_model1.pth`) is in `deepfake_detection/weights/` and matches the model architecture.
- **Database errors?**  
  - Delete the `deepfake_detection.db` file to reset the database.
- **UI not updating?**  
  - Clear your browser cache or restart the frontend dev server.

---


## 📜 License

[MIT](LICENSE)

---

> _Made by [shyambabukollabathula](https://github.com/shyambabukollabathula) and AI for a safer digital world._
