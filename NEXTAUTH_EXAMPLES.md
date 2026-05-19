# NextAuth Usage Examples

## Using Authentication in Different Scenarios

### 1. Get Session in Server Component

```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {session.user.firstName}!</h1>
      <p>Email: {session.user.email}</p>
      <p>Status: {session.user.isActive ? "Active" : "Inactive"}</p>
    </div>
  );
}
```

### 2. Use Session in Client Component

```typescript
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <p>Logged in as: {session.user.name}</p>
      <p>ID: {session.user.id}</p>
      <p>Active: {session.user.isActive ? "Yes" : "No"}</p>
    </div>
  );
}
```

### 3. Using Custom useAuth Hook

```typescript
"use client";

import { useAuth } from "@/hooks/use-nextauth";

export default function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <button>Login</button>;
  }

  return (
    <div>
      <p>Welcome {user?.firstName} {user?.lastName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 4. Sign Out / Logout

```typescript
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/login",
    });
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### 5. Conditional Rendering Based on Auth

```typescript
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav>
      {session ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <span>{session.user.email}</span>
          <Link href="/api/auth/signout">Sign Out</Link>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/forgot-password">Forgot Password?</Link>
        </>
      )}
    </nav>
  );
}
```

### 6. Custom API Route with Session

```typescript
// /src/app/api/user/profile/route.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
  });
}
```

### 7. Update Session in Callback

```typescript
// In your /src/auth.ts, you can update session in callback
callbacks: {
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      session.user.isActive = token.isActive as boolean;
      (session as any).accessToken = token.accessToken as string;
      (session as any).expiresIn = token.expiresIn as string;
    }
    return session;
  },
}
```

### 8. Sign In with Error Handling

```typescript
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={isLoading}>{isLoading ? "Signing in..." : "Sign In"}</button>
    </form>
  );
}
```

### 9. Redirect to Login if Not Authenticated

```typescript
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <div>Redirecting...</div>;
  }

  return <>{children}</>;
}
```

### 10. Access Token in Client Component

```typescript
"use client";

import { useSession } from "next-auth/react";

export default function ApiCall() {
  const { data: session } = useSession();

  const fetchData = async () => {
    const response = await fetch("/api/some-endpoint", {
      headers: {
        Authorization: `Bearer ${(session as any)?.accessToken}`,
      },
    });
    return response.json();
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

## Common Patterns

### Pattern: Protect a Whole Layout

```typescript
// /src/app/dashboard/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

### Pattern: Check Permissions

```typescript
"use client";

import { useSession } from "next-auth/react";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  // You'd need to add role/permissions to your session
  // if (session?.user.role !== "admin") {
  //   return <div>Access denied</div>;
  // }

  return <>{children}</>;
}
```

## Debugging

### Check Current Session in Browser Console

```typescript
// In any client component
const { data: session } = useSession();
console.log("Current session:", session);
```

### View NextAuth Logs

Set `DEBUG=next-auth:*` environment variable:

```bash
DEBUG=next-auth:* npm run dev
```

### Check JWT Token

The JWT is stored in a secure HTTP-only cookie by default. You can inspect it in:
1. Browser DevTools → Application → Cookies → `next-auth.session-token`
2. But the actual token content is not directly accessible from JavaScript for security

## TypeScript Types

The session type is defined in `/src/types/next-auth.d.ts`:

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  accessToken: string;
  expiresIn: string;
}
```

Use it in your components:

```typescript
const { data: session } = useSession();
// session.user.firstName is now typed!
const greeting = `Hello ${session?.user.firstName}!`;
```
