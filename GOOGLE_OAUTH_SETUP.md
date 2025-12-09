# Google OAuth Setup Guide for E-Commerce Application

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name (e.g., "E-Commerce App")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Your E-Commerce App Name
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. On "Scopes" page, click "Add or Remove Scopes"
7. Add these scopes:
   - `email`
   - `profile`
   - `openid`
8. Click "Save and Continue"
9. On "Test users" (if in testing mode), add your test email addresses
10. Click "Save and Continue"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Fill in the details:

### For Development (localhost):

**Name**: E-Commerce Web Client

**Authorized JavaScript origins**:
```
http://localhost:3000
http://localhost:8000
```

**Authorized redirect URIs**:
```
http://localhost:3000/api/auth/callback/google
http://localhost:3000
```

### For Production:

**Authorized JavaScript origins**:
```
https://yourdomain.com
https://www.yourdomain.com
```

**Authorized redirect URIs**:
```
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com
```

5. Click "Create"
6. **Save your credentials**:
   - Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-xxxxx`)

## Step 5: Configure Laravel Backend

1. Open your Laravel `.env` file
2. Add these variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000
```

3. Open `config/services.php` and verify it has:

```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```

## Step 6: Configure Next.js Frontend

1. Open your Next.js `.env.local` file
2. Add:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

## Step 7: Install Required Packages

### Laravel:
The Google API PHP client should already be installed. If not:

```bash
cd laravel-api
composer require google/apiclient:"^2.0"
```

### Next.js:
Install Google OAuth package:

```bash
cd next-app
npm install @react-oauth/google
```

## Step 8: Update Frontend Google Login Component

Make sure your Google login button uses the correct setup:

```typescript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Wrap your app with GoogleOAuthProvider
<GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
  <YourApp />
</GoogleOAuthProvider>

// In your login component:
<GoogleLogin
  onSuccess={(credentialResponse) => {
    // Send credentialResponse.credential to your backend
    handleGoogleLogin(credentialResponse.credential);
  }}
  onError={() => {
    console.log('Login Failed');
  }}
/>
```

## Current API Routes

### Backend (Laravel):
- **POST** `/api/google-login`
  - Body: `{ "token": "google-id-token" }`
  - Returns: User data and auth token

### Frontend:
Your Google login should send the credential to:
```
POST http://localhost:8000/api/google-login
```

## Testing the Setup

1. Start your Laravel backend:
```bash
cd laravel-api
php artisan serve
```

2. Start your Next.js frontend:
```bash
cd next-app
npm run dev
```

3. Open `http://localhost:3000` and try logging in with Google

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches your frontend URL
- Check for trailing slashes or http vs https

### Error: "invalid_client"
- Double-check your Client ID and Client Secret
- Make sure they're correctly set in `.env`

### Error: "Access blocked: This app's request is invalid"
- Complete the OAuth consent screen configuration
- Make sure you've added your email as a test user if in testing mode

### Blocked User Message
When a user tries to log in and their account is blocked, they will see:
```
"Your account has been blocked by the administrator. Please contact support for assistance."
```

## Security Notes

1. **Never commit** your `.env` files to version control
2. Keep your Client Secret secure
3. Use HTTPS in production
4. Regularly rotate your credentials
5. Monitor the Google Cloud Console for suspicious activity

## Production Checklist

Before going to production:

- [ ] Update authorized domains in Google Console
- [ ] Change OAuth consent screen from "Testing" to "In production"
- [ ] Update `.env` with production URLs
- [ ] Use HTTPS for all redirect URIs
- [ ] Test login flow thoroughly
- [ ] Set up error logging
- [ ] Configure rate limiting

## Support Contacts

- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- Laravel Socialite Docs: https://laravel.com/docs/socialite
- React OAuth Google: https://www.npmjs.com/package/@react-oauth/google
