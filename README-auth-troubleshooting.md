# Google Authentication Troubleshooting Guide

This guide will help you troubleshoot common issues with Google sign-in and sign-out in this Astro + Svelte 5 + Better-auth + Cloudflare setup.

## Quick Checklist

### Environment Variables Required

Make sure these environment variables are set in both local development and Cloudflare Pages:

```bash
# Required for Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Required for Better Auth
BETTER_AUTH_SECRET=your_random_secret_key
BETTER_AUTH_URL=https://your-domain.pages.dev  # or http://localhost:4321 for dev

# Database (D1 is configured via wrangler.toml)
DATABASE_URL=your_libsql_url  # Optional, for local development
```

### Cloudflare Configuration

1. **D1 Database**: Ensure your D1 database is properly configured in `wrangler.toml`
2. **Environment Variables**: Set secrets using `wrangler secret put VARIABLE_NAME`
3. **Domain**: Make sure your domain is correctly set in Google OAuth settings

## Common Issues and Solutions

### 1. "Auth not configured" Error

**Symptoms**: Getting 500 error with "Auth not configured" message

**Causes**:
- Missing environment variables
- Database connection issues
- Middleware not properly initializing auth

**Solutions**:
1. Check if all required environment variables are set
2. Verify D1 database is accessible
3. Check middleware logs for initialization errors
4. Visit `/api/debug/auth` in development mode for detailed diagnostics

### 2. Google OAuth Redirect Issues

**Symptoms**: 
- Redirected to error page after Google login
- "Invalid redirect URI" error
- OAuth flow doesn't complete

**Solutions**:
1. **Check Google Console Settings**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     ```
     http://localhost:4321/api/auth/callback/google
     https://your-domain.pages.dev/api/auth/callback/google
     ```

2. **Verify Environment Variables**:
   ```bash
   # Check if CLIENT_ID matches Google Console
   echo $GOOGLE_CLIENT_ID
   
   # Verify CLIENT_SECRET is set
   echo $GOOGLE_CLIENT_SECRET | wc -c  # Should be > 1
   ```

3. **Check Base URL Configuration**:
   - Ensure `BETTER_AUTH_URL` matches your actual domain
   - For local development: `http://localhost:4321`
   - For production: `https://your-domain.pages.dev`

### 3. Session Not Persisting

**Symptoms**:
- User appears logged in briefly, then logged out
- Session doesn't survive page refresh
- Intermittent authentication state

**Solutions**:
1. **Cookie Issues**:
   - Check if cookies are being set properly in browser dev tools
   - Ensure domain matches in production
   - Verify HTTPS is used in production (required for secure cookies)

2. **Database Session Storage**:
   - Check if sessions are being saved to D1 database
   - Verify database schema is up to date
   - Run database migrations if needed

3. **Cloudflare Settings**:
   - Disable Cloudflare's security features that might interfere with cookies
   - Check if Browser Integrity Check is causing issues

### 4. Sign-out Not Working

**Symptoms**:
- User remains logged in after clicking sign out
- Sign out button doesn't respond
- Session persists after sign out

**Solutions**:
1. **Clear Browser Data**:
   - Clear cookies for your domain
   - Clear localStorage/sessionStorage
   - Try incognito/private browsing mode

2. **Force Refresh After Sign Out**:
   - The current implementation includes `window.location.reload()`
   - If still having issues, try `window.location.href = '/'`

3. **Check Network Tab**:
   - Ensure sign-out API call is being made
   - Verify response is successful (200 status)
   - Check if cookies are being cleared

### 5. Development vs Production Issues

**Symptoms**: Works in development but fails in production

**Solutions**:
1. **Environment Variables**:
   ```bash
   # Set Cloudflare secrets (run from project root)
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put BETTER_AUTH_URL
   ```

2. **Domain Configuration**:
   - Update Google OAuth settings with production domain
   - Ensure `BETTER_AUTH_URL` points to production URL
   - Check that database is accessible from Cloudflare Workers

3. **CORS and Security**:
   - Verify trusted origins in auth configuration
   - Check Cloudflare security settings
   - Ensure HTTPS is properly configured

## Debugging Steps

### 1. Enable Debug Mode

Visit `/api/debug/auth` in development mode to get detailed diagnostics:

```bash
curl http://localhost:4321/api/debug/auth | jq .
```

### 2. Check Browser Console

Open browser dev tools and look for:
- JavaScript errors during sign-in/sign-out
- Network requests to `/api/auth/*` endpoints
- Cookie-related warnings or errors

### 3. Check Server Logs

Monitor Cloudflare Workers logs or local development console for:
- Middleware initialization messages
- Auth handler requests and responses
- Database connection errors
- Better Auth internal errors

### 4. Verify Database Schema

Ensure your database has the correct tables:

```sql
-- Required tables for Better Auth
.tables  -- Should show: user, session, account, verification
.schema user
.schema session
.schema account
.schema verification
```

### 5. Test API Endpoints Directly

Test individual auth endpoints:

```bash
# Check session
curl -b cookies.txt http://localhost:4321/api/auth/session

# Test Google OAuth initiation
curl -I http://localhost:4321/api/auth/sign-in/google
```

## Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables are set in Cloudflare Pages
- [ ] Google OAuth redirect URIs include production domain
- [ ] D1 database is created and accessible
- [ ] Database migrations have been run
- [ ] `BETTER_AUTH_URL` points to production domain
- [ ] SSL/HTTPS is properly configured
- [ ] Test sign-in/sign-out flow in production

## Advanced Configuration

### Custom Error Handling

The current setup includes enhanced error handling:
- Detailed error logging in `/api/auth/[...all].ts`
- User-friendly error page at `/login-error`
- Automatic redirect handling in auth client

### Session Configuration

Current session settings:
- Expires in 7 days
- Updates every 24 hours
- 5-minute cookie cache

### Security Features

- CSRF protection enabled
- Secure cookie settings in production
- Trusted origins validation
- Dangerous email account linking allowed (can be disabled)

## Getting Help

If you're still experiencing issues:

1. **Check the logs**: Look at both browser console and server logs
2. **Use debug endpoint**: Visit `/api/debug/auth` for detailed diagnostics
3. **Verify configuration**: Double-check all environment variables and Google Console settings
4. **Test incrementally**: Start with a fresh browser session and test each step
5. **Compare environments**: Ensure development and production configurations match

## Common Error Messages

### "Invalid request" from Google
- Check redirect URI configuration
- Verify client ID and secret
- Ensure proper URL encoding

### "Access denied" from Google
- User cancelled OAuth flow
- Check OAuth consent screen configuration
- Verify app is not restricted

### "Session not found"
- Database connection issues
- Cookie problems
- Session expired or corrupted

### "Auth handler error"
- Better Auth configuration issues
- Missing environment variables
- Database schema problems

Remember to check both the browser console and server logs when troubleshooting, as issues can occur on either the client or server side.