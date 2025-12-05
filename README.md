# SkateQuest

A cross-platform app built with React Native, Expo, and Supabase authentication.

**✨ Runs on iOS, Android, AND Web from a single codebase! ✨**

## Features

- 🌐 **Cross-platform**: Works on iOS, Android, and Web browsers
- 🔐 User authentication (Sign up, Sign in, Sign out)
- 🔑 Password reset functionality
- 🛡️ Protected routes
- 💾 Persistent sessions using AsyncStorage
- 🎨 Modern UI with React Navigation

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account and project

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API in your Supabase dashboard
3. Copy your project URL and anon/public key

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd SkateQuest-1
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key-here
```

## Running the App

### Option 1: All Platforms (Interactive Menu)
```bash
npm start
```
Then choose:
- Press `w` for **Web** (opens in browser)
- Press `i` for **iOS** simulator
- Press `a` for **Android** emulator
- Scan QR code with **Expo Go** app on your physical device

### Option 2: Direct Launch

**Web Browser:**
```bash
npm run web
```
This opens the app at `http://localhost:8081` in your browser.

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

## Project Structure

```
SkateQuest-1/
├── contexts/
│   └── AuthContext.tsx       # Authentication context and provider
├── lib/
│   └── supabase.ts           # Supabase client configuration
├── navigation/
│   └── AppNavigator.tsx      # Navigation setup with protected routes
├── screens/
│   ├── LoginScreen.tsx       # Login screen
│   ├── SignUpScreen.tsx      # Sign up screen
│   ├── ForgotPasswordScreen.tsx  # Password reset screen
│   └── HomeScreen.tsx        # Home screen (authenticated)
├── App.tsx                   # Main app component
├── package.json              # Dependencies
└── .env                      # Environment variables (create this)
```

## Authentication Flow

The app features a complete authentication system with protected routes:

1. **Sign Up** (`screens/SignUpScreen.tsx`):
   - Users create an account with email and password
   - Password confirmation validation
   - Email verification sent by Supabase

2. **Sign In** (`screens/LoginScreen.tsx`):
   - Users log in with their credentials
   - Forgot password link
   - Auto-redirect to sign up

3. **Password Reset** (`screens/ForgotPasswordScreen.tsx`):
   - Email-based password reset
   - Uses Supabase password recovery

4. **Protected Home Screen** (`screens/HomeScreen.tsx`):
   - Only accessible when authenticated
   - Displays user email
   - Sign out functionality

5. **Session Management**:
   - Sessions persisted using AsyncStorage
   - Auto-refresh tokens
   - Automatic navigation based on auth state

## Supabase Configuration

The app uses the following Supabase auth configuration:

```typescript
{
  auth: {
    storage: AsyncStorage,        // Persist sessions locally
    autoRefreshToken: true,        // Auto-refresh tokens
    persistSession: true,          // Persist session across app restarts
    detectSessionInUrl: false,     // Disable for React Native
    lock: processLock,            // Custom lock for session management
  }
}
```

## Customization

### Styling
All screens use StyleSheet for styling. Modify the `styles` object in each screen file to customize the appearance.

### Additional Features
You can extend the app by:
- Adding user profile management
- Implementing social login (Google, Apple, etc.)
- Adding more screens and features
- Integrating with Supabase database for data storage

## Troubleshooting

### "Unable to resolve module" errors
```bash
npm install
expo start --clear
```

### Supabase connection issues
- Verify your `.env` file has the correct credentials
- Check that your Supabase project is active
- Ensure you're using the anon/public key, not the service role key

### Navigation issues
```bash
npm install @react-navigation/native @react-navigation/native-stack
expo install react-native-screens react-native-safe-area-context
```

## Deployment

### Web Deployment

Build for production:
```bash
npx expo export:web
```

This creates a `web-build` folder. Deploy it to:
- **Netlify**: Drag and drop the `web-build` folder
- **Vercel**: `npx vercel --prod`
- **GitHub Pages**: Push `web-build` to gh-pages branch
- **Any static host**: Upload the `web-build` folder

### Mobile Deployment

**Build for iOS/Android:**
```bash
npx eas build --platform ios
npx eas build --platform android
```

**Publish updates:**
```bash
npx eas update
```

See [Expo EAS docs](https://docs.expo.dev/eas/) for full deployment guide.

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)
- [Expo Web](https://docs.expo.dev/workflow/web/)

## License

MIT
