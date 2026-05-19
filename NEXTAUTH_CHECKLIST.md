# NextAuth Migration Checklist

## ✅ Completed
- [x] Install next-auth package
- [x] Create auth configuration file (/src/auth.ts)
- [x] Create NextAuth API route handler
- [x] Create SessionProvider component
- [x] Create middleware for route protection
- [x] Create custom useAuth hook
- [x] Add NextAuth type definitions
- [x] Update root layout with SessionProvider
- [x] Update login form to use signIn()
- [x] Create .env.local template
- [x] Project builds successfully

## 📋 TODO - Before Production

### Critical
- [ ] Generate NEXTAUTH_SECRET with: `npx auth secret`
- [ ] Update `.env.local` with generated secret
- [ ] Test login flow end-to-end
- [ ] Verify token is properly stored/managed
- [ ] Test logout functionality
- [ ] Test protected route access
- [ ] Test redirect behavior

### Important
- [ ] Update any remaining references to old token-manager in other components
- [ ] Update logout buttons to use NextAuth's signOut()
- [ ] Test forgot password flow integration
- [ ] Test password reset flow integration
- [ ] Verify dashboard access when authenticated
- [ ] Verify login redirect when unauthenticated
- [ ] Test remember me functionality (if needed)

### Nice to Have
- [ ] Remove old auth files when confident in NextAuth setup
  - `/src/lib/token-manager.ts`
  - `/src/lib/auth-context.tsx`
  - `/src/actions/auth.actions.ts`
  - `/src/lib/use-protected-route.ts`
- [ ] Update any other components using old auth system
- [ ] Add refresh token logic if your backend supports it
- [ ] Add CSRF protection if needed
- [ ] Configure NextAuth error pages

## 🔧 New Files Created

1. `/src/auth.ts` - NextAuth config
2. `/src/app/api/auth/[...nextauth]/route.ts` - API handler
3. `/src/components/providers/next-auth-provider.tsx` - Session provider
4. `/src/middleware.ts` - Route protection
5. `/src/hooks/use-nextauth.ts` - Custom hook
6. `/src/types/next-auth.d.ts` - TypeScript definitions
7. `/.env.local` - Environment config (template)
8. `/NEXTAUTH_MIGRATION.md` - Full migration guide

## 📝 Modified Files

1. `/src/app/layout.tsx` - Added SessionProvider
2. `/src/app/(auth)/login/login-form.tsx` - Updated to use signIn()

## 🚀 Getting Started

```bash
# 1. Generate secret
npx auth secret

# 2. Update .env.local with secret and API URL
echo "NEXTAUTH_SECRET=<your_secret>" >> .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" >> .env.local

# 3. Start dev server
npm run dev

# 4. Test at http://localhost:3000/login
```

## 📚 Reference Commands

```bash
# Generate NextAuth secret
npx auth secret

# Build project
npm run build

# Run dev server
npm run dev

# Check types
npm run type-check

# Sign out all users
# Clear .next folder and rebuild
rm -rf .next && npm run build
```
