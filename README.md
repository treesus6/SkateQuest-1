# SkateQuest Mobile

A cross-platform **mobile app** built with React Native, Expo, and Supabase authentication.

**✨ Runs on iOS, Android, AND Web from a single codebase! ✨**

> **Note**: This is the mobile version of SkateQuest. The original web app at [sk8.quest](https://sk8.quest) remains unchanged. This app uses the same 2585 parks data from the original SkateQuest database.

## Features

- 🌐 **Cross-platform**: Works on iOS, Android, and Web browsers
- 🔐 **User authentication** (Sign up, Sign in, Sign out)
- 🔑 **Password reset** functionality
- 🛡️ **Protected routes** for authenticated users
- 💾 **Persistent sessions** using AsyncStorage
- 🎨 **Modern UI** with React Navigation
- 🛹 **Skateparks discovery** - Browse 2585 skateparks from around the world
- 📍 **Park details** - View location, difficulty, features, hours, and pricing
- ⭐ **Favorites** - Save your favorite skateparks (stored in Supabase)
- 🔍 **Search & filter** - Find parks by name, location, or difficulty level
- 🗺️ **Maps integration** - Open park locations in Google Maps

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account and project

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API in your Supabase dashboard
3. Copy your project URL and anon/public key
4. Go to SQL Editor in your Supabase dashboard
5. Copy the contents of `database-setup.sql` and run it to create the favorites table

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
├── data/
│   └── parks.json            # Skatepark data (8 parks)
├── lib/
│   └── supabase.ts           # Supabase client configuration
├── navigation/
│   └── AppNavigator.tsx      # Navigation setup with protected routes
├── screens/
│   ├── LoginScreen.tsx       # Login screen
│   ├── SignUpScreen.tsx      # Sign up screen
│   ├── ForgotPasswordScreen.tsx  # Password reset screen
│   ├── HomeScreen.tsx        # Home screen (authenticated)
│   ├── ParksListScreen.tsx   # Browse all skateparks
│   └── ParkDetailScreen.tsx  # Individual park details
├── App.tsx                   # Main app component
├── database-setup.sql        # Supabase database schema
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

## Skateparks Features

The app includes a comprehensive skatepark discovery system with **2585 skateparks worldwide**:

1. **Parks List** (`screens/ParksListScreen.tsx`):
   - Browse 2585 skateparks from around the world
   - Real OpenStreetMap data
   - Search parks by name
   - View coordinates for each park
   - Clean, simple list interface

2. **Park Details** (`screens/ParkDetailScreen.tsx`):
   - Park name, type, and coordinates
   - One-tap Google Maps integration
   - Save parks to favorites with heart icon
   - GPS coordinates for navigation

3. **Favorites System**:
   - Heart icon to add/remove favorites
   - Favorites stored in Supabase database
   - Synced across all devices
   - Requires authentication

4. **Parks Data** (`data/parks.json`):
   - 2585 skateparks from OpenStreetMap
   - Includes name, type, latitude, longitude
   - Migrated from original SkateQuest Firebase database
   - Optional: Import to Supabase using `scripts/import-parks.js`

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
