#!/usr/bin/env python3
"""
Script to update CORS settings with your Vercel URL
"""

def update_cors_settings():
    print("🚀 CORS Update Helper")
    print("=" * 50)
    
    vercel_url = input("Enter your Vercel frontend URL (e.g., https://your-app.vercel.app): ").strip()
    
    if not vercel_url.startswith('https://'):
        print("❌ URL should start with https://")
        return
    
    # Read the current main.py file
    main_py_path = "deepfake_detection/app/main.py"
    
    try:
        with open(main_py_path, 'r') as f:
            content = f.read()
        
        # Replace the placeholder URL
        updated_content = content.replace(
            '"https://your-frontend-domain.vercel.app"',
            f'"{vercel_url}"'
        )
        
        # Write back
        with open(main_py_path, 'w') as f:
            f.write(updated_content)
        
        print(f"✅ Updated CORS settings with: {vercel_url}")
        print("📝 Next steps:")
        print("1. Deploy your backend to Railway/Render/Heroku")
        print("2. Get your backend URL")
        print("3. Add VITE_API_BASE_URL environment variable in Vercel")
        print("4. Redeploy your frontend")
        
    except FileNotFoundError:
        print(f"❌ Could not find {main_py_path}")
        print("Make sure you're running this from the project root directory")

if __name__ == "__main__":
    update_cors_settings()