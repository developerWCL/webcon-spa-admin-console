# NextAuth Migration - Setup Guide

## Overview
Successfully migrated the Orientala Spa authentication system from custom server actions and token manager to NextAuth v4.

## Changes Made

### 1. **Package Installation**
- Installed `next-auth@4.24.13`

### 2. **New Files Created**

#### `/src/auth.ts`
- Main NextAuth configuration file
- Exports `auth` function for middleware usage
- Configured with Credentials Provider for email/password authentication
- Connects to backend API endpoint: `{API_BASE_URL}/staff-auth/login`
- JWT session strategy with 24-hour max age

#### `/src/app/api/auth/[...nextauth]/route.ts`
- NextAuth route handler
- Exports GET and POST methods
- Handles all authentication endpoints automatically

#### `/src/components/providers/next-auth-provider.tsx`
- Client component that wraps the app with SessionProvider
- Enables useSession hook throughout the app

#### `/src/middleware.ts`
- Protects dashboard routes - redirects unauthenticated users to /login
- Redirects authenticated users away from /login page
- Uses NextAuth v4 middleware pattern with `auth()` wrapper

#### `/src/hooks/use-nextauth.ts`
- Custom hook for using authentication in components
- Exports: `session`, `user`, `isLoading`, `isAuthenticated`, `logout`
- Wraps useSession and signOut from next-auth/react

#### `/src/types/next-auth.d.ts`
- TypeScript type definitions for NextAuth
- Extends Session, User, and JWT interfaces with custom fields:
  - `id`, `firstName`, `lastName`, `isActive`, `accessToken`, `expiresIn`

#### `/.env.local`
- Environment configuration template
- Requires: `NEXTAUTH_SECRET` (generate with `npx auth secret`)
- Optional: `NEXT_PUBLIC_API_URL` (defaults to http://localhost:3001)

### 3. **Modified Files**

#### `/src/app/layout.tsx`
- Removed: `AuthProvider` from auth-context
- Added: `NextAuthSessionProvider` wrapper
- Enables SessionProvider context for the entire app

#### `/src/app/(auth)/login/login-form.tsx`
- Replaced `loginAction` server action with `signIn` from next-auth/react
- Removed `tokenManager` usage
- Changed from `useTransition` to `useState` for loading state
- Updated all `isPending` references to `isLoading`
- SignIn call includes `redirect: false` to handle routing manually
- Redirects to `/dashboard` on successful login

## Migration Guide

### Before (Old System)
```typescript
// Using custom server actions
import { loginAction } from "@/actions/auth.actions";
import { tokenManager } from "@/lib/token-manager";

const result = await loginAction(values);
tokenManager.setStaffData(result.data.staff);
```

### After (NextAuth)
```typescript
// Using NextAuth
import { signIn } from "next-auth/react";

const result = await signIn("credentials", {
  email: values.email,
  password: values.password,
  redirect: false,
});

if (result?.ok) {
  router.push("/dashboard");
}
```

## Using Authentication in Components

### Server Components
```typescript
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }
  
  return <div>{session.user.firstName}</div>;
}
```

### Client Components
```typescript
"use client";
import { useSession } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Not authenticated</div>;
  
  return <div>Hello {session.user.firstName}</div>;
}
```

### Using Custom Hook
```typescript
"use client";
import { useAuth } from "@/hooks/use-nextauth";

export default function Component() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
}
```

## Environment Setup

### Generate NEXTAUTH_SECRET
```bash
npx auth secret
```

Copy the generated secret to `.env.local`:
```env
NEXTAUTH_SECRET=your_generated_secret_here
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Session Structure

The session now includes:

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    image?: string;
  };
  accessToken: string;
  expiresIn: string;
  expires: string; // NextAuth standard
}
```

## API Integration

The system connects to your backend at:
- **Login endpoint**: `POST {API_BASE_URL}/staff-auth/login`
- **Expected response**:
```json
{
  "accessToken": "jwt_token",
  "expiresIn": "86400",
  "staff": {
    "id": "staff_id",
    "email": "staff@email.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true
  }
}
```

## Files to Remove (Old Auth System)

Consider removing these files as they're no longer needed:
- `/src/lib/token-manager.ts` - Token management moved to NextAuth
- `/src/lib/auth-context.tsx` - Replaced by SessionProvider
- `/src/actions/auth.actions.ts` - Replaced by NextAuth API routes
- `/src/lib/use-protected-route.ts` - Middleware now handles protection

## Next Steps

1. **Generate NEXTAUTH_SECRET**: `npx auth secret`
2. **Update .env.local** with the generated secret
3. **Test the login flow** at `/login`
4. **Update any components** using the old auth context to use new methods
5. **Update logout flows** to use NextAuth's `signOut()`
6. **Test protected routes** - middleware should redirect unauthenticated users

## References

- [NextAuth Documentation](https://next-auth.js.org/)
- [NextAuth v4 API Reference](https://next-auth.js.org/configuration/pages-and-providers)
- [JWT Session Strategy](https://next-auth.js.org/configuration/options#session)
