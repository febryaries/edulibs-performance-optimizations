import { createClient } from "@/utils/supabase/server"
import { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const supabase = await createClient();
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  const code = requestUrl.searchParams.get('code')

  if (code) {
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${origin}/sign-in`);
    }
    return NextResponse.redirect(`${origin}${next}`)
  } else {
    const token_hash = requestUrl.searchParams.get('token_hash')
    const type = requestUrl.searchParams.get('type') as EmailOtpType | null
    const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
    // console.log("Callback route called");
    // console.log(origin)

    if (token_hash && type) {
      // console.log("Exchanging code for session");

      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(`${origin}/sign-in`);
      }
    }

    if (redirectTo) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    // URL to redirect to after sign up process completes
    return NextResponse.redirect(`${origin}/dashboard`);
  }


}