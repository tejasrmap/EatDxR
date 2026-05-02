# MADEATER

The social network for **food critics and lovers**. 

Madeater is a high-energy, Neo-Brutalist web application designed for users to log, review, and share their culinary experiences. Built with modern web technologies and a stark, streetwear-inspired aesthetic, Madeater completely reimagines the traditional restaurant review platform.

## 🚀 Features
- **Neo-Brutalist Aesthetic**: High contrast, stark borders, and bold typography.
- **Experience Logging**: Track every meal you've ever eaten and share your thoughts with the world.
- **Restaurant Discovery**: Search for food places and browse popular dishes across cities.
- **Interactive Feed**: Like, comment, and engage with other food lovers on a tactile, animated interface.
- **Real-Time Data**: Instant updates powered by Firebase Firestore.

## 💻 Tech Stack
- **Frontend**: React 19, Vite, React Router v7
- **Styling**: Tailwind CSS v4, custom Neo-Brutalist utility classes
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Backend/Database**: Firebase (Auth, Firestore, Storage)

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd EatDxR
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Set up your `.env` file with your Firebase configuration. You will need:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🎨 Design Philosophy
Madeater uses a "Dark Neo-Brutalist" design language:
- Pure `#000000` backgrounds.
- High impact neon colors: Lime (`#ccff00`), Pink (`#ff00ff`), Cyan (`#00ffff`).
- Chunky borders, sharp corners, and massive offset drop shadows.
- `Outfit` font for bold, uppercase tracking.

## 📄 License
MIT License
