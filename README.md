# 💬 Real-Time Chat App

A robust, real-time chat application built with **React**, **Vite**, and **Firebase**. This project offers a seamless messaging experience, complete with group chat management, file sharing, push notifications, and high-performance virtualized lists.

![Login Page](./screenshot/login%20page.png)

## 🚀 Features

- **Real-Time Communication**: Instant messaging powered by Firebase Cloud Firestore.
- **Advanced User Search**: Find peers instantly by searching emails or usernames using prefix matching.
- **Group Chat Management**: Fully interactive groups where all members can dynamically update the group name, biography, and avatar (DP).
- **Rich File Sharing**: Share more than just images! Full support for documents, PDFs, and other file types within chats.
- **Push Notifications**: Stay updated even when you're away with Firebase Cloud Messaging (FCM) browser push notifications.
- **High-Performance Chat Window**: Smooth scrolling capable of handling thousands of messages gracefully, implemented via virtualized lists (`react-window`).
- **State Management**: Lightweight and lightning-fast state synchronization using Zustand.
- **Emoji Support**: Express yourself with the integrated `emoji-picker-react`.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Backend & Services**: Firebase (Authentication, Firestore, Cloud Storage, Cloud Messaging)
- **State Management**: Zustand
- **Performance / Virtualization**: `react-window`, `react-virtualized-auto-sizer`
- **Linting**: ESLint

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- A Firebase project with Auth, Firestore, and Storage enabled.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd chat-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

## 📜 Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Bundles the app into static files for production.
- `npm run preview`: Locally preview the production build.
- `npm run lint`: Runs ESLint to check for code issues.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is open-source and free to use.
