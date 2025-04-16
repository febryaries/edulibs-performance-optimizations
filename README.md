This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication with Supabase

This project uses Supabase for authentication, supporting both email/password and Google OAuth login methods.

### Authentication Flow

1. **Email/Password Authentication**:
   - Users can sign up with email/password
   - Email verification is required to activate the account
   - Password reset functionality is available

2. **Google OAuth Authentication**:
   - Users can sign in with their Google account
   - Redirected back to the application after successful authentication

3. **Session Management**:
   - Sessions are persisted using Supabase's cookie-based session management
   - Middleware protects routes that require authentication
   - User data is stored in Supabase Auth

### Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can get these values from your Supabase project dashboard under Project Settings > API.

### Supabase Setup

1. Create a new project on [Supabase](https://supabase.com/)
2. Enable Email/Password authentication in Authentication > Providers
3. Enable Google OAuth in Authentication > Providers
   - You'll need to set up a Google OAuth application in the Google Cloud Console
   - Add the redirect URL: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Configure your Site URL and Redirect URLs in Authentication > URL Configuration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



supabase gen types typescript --linked --schema=public > src/utils/database.types.ts