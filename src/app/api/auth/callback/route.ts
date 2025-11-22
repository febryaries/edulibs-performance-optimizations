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
    
    // Get the user after successful authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if the user exists in the users table and has been invited
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('status, email')
        .eq('id', user.id)
        .single();
      
      // If user doesn't exist in the database or there was an error
      if (userError || !userData) {
        // Check if any user with this email exists and is invited
        const { data: invitedUsers, error: invitedError } = await supabase
          .from('users')
          .select('id, status')
          .eq('email', user.email)
          .in('status', ['INVITED', 'ACTIVE'])
          .limit(1);
        
        if (invitedError || !invitedUsers || invitedUsers.length === 0) {
          // User is not invited, sign them out and redirect to forbidden page
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/forbidden?reason=not_invited`);
        }
        
        // If we found an invited user with matching email but different ID,
        // we need to update the user record with the new auth ID
        if (invitedUsers.length > 0) {
          // Update the user record with the new auth ID
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: user.id })
            .eq('id', invitedUsers[0].id);
          
          if (updateError) {
            console.error("Error updating user ID:", updateError);
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/forbidden?reason=error`);
          }
        }
      } else if (userData.status === 'INVITED') {
        // User is invited but not activated yet
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/activate?email=${encodeURIComponent(userData.email)}`);
      } else if (userData.status !== 'ACTIVE') {
        // User exists but doesn't have the right status
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/forbidden?reason=inactive`);
      }
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