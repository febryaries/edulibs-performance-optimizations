import { Webhook } from "standardwebhooks";
import { EmailProps, sendEmail } from "@/lib/email-service";

const webhook = new Webhook("v1,whsec_mQQxmJ+Fs0T+fZxN7Ilp1M6nrhzrBPJ6RfBVznYq5XtGnx9Y1Oc9xz7NHxxnTvJyv4Z/VYzuJ6vDX7X6".replace("v1,whsec_", ""));
//new Webhook(process.env.SEND_EMAIL_HOOK_SECRET!.replace("v1,whsec_", ""));

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  try {
    const { user, email_data } = webhook.verify(rawBody, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new: string;
        token_hash_new: string;
      };
    };

    console.log(email_data);

    // Generate dynamic values for the email based on the action type
    const action = email_data.email_action_type;

    // Fix: Use a properly constructed URL with the token as a path parameter instead of a query parameter
    // This is more robust against email clients modifying the URL
    let finalUrl;


    console.log(email_data);

    const domain = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    switch (action) {
      case 'signup':
        const signup_path = '/complete-profile'
        const signup_params = new URLSearchParams({
          token_hash: email_data.token_hash,
          type: email_data.email_action_type,
          redirect_to: signup_path
        })
        finalUrl = `${domain}/api/auth/callback?${signup_params.toString()}`
        break;
      case 'recovery':
        const recovery_path = '/update-password'
        const recovery_params = new URLSearchParams({
          token_hash: email_data.token_hash,
          type: email_data.email_action_type,
          redirect_to: recovery_path
        })
        finalUrl = `${domain}/api/auth/callback?${recovery_params.toString()}`
        break;
      case 'magiclink':
        finalUrl = `${domain}/register?code=${email_data.token}&email=${encodeURIComponent(user.email)}`
        break;

      default:
        return;
    }

    const emailSubject = {
      magiclink: "Loheaza-te la contul tău",
      recovery: "Reseteaza parola",
      email_change: "Confirmă schimbarea adresei de email",
      signup: "Confirmă-ți adresa de email pentru EDU Apps"
    }[action] || "Completeaza actiunea ta";

    const emailBodyText = {
      magiclink: `Pentru a te autentifica în aplicația EDU Apps, te rugăm să dai click pe butonul de mai jos.`,
      recovery: `Pentru a-ți reseta parola contului EDU Apps, te rugăm să dai click pe butonul de mai jos.`,
      email_change: `Pentru a confirma schimbarea adresei de email pentru contul tău EDU Apps, te rugăm să dai click pe butonul de mai jos.`,
      signup: `Îți mulțumim pentru înregistrarea în aplicația EDU Apps. Pentru a-ți confirma adresa de email și a activa contul, te rugăm să dai click pe butonul de mai jos.`
    }[action] || `Pentru a finaliza actiunea "${action}", dă click pe butonul de mai jos.`;

    const buttonText = {
      magiclink: "Loheaza-te la contul tău",
      recovery: "Reseteaza parola",
      email_change: "Confirmă schimbarea adresei de email",
      signup: "Confirmă adresa de email pentru EDU Apps"
    }[action] || "Continuă";

    const emailProps: EmailProps = {
      previewText: emailSubject,
      recipientName: user.email.split("@")[0],
      bodyText: emailBodyText,
      buttonText,
      buttonLink: finalUrl, // Use the finalUrl instead of email_data.redirect_to
    };

    // Send email using our new email service
    const result = await sendEmail({
      to: user.email,
      subject: emailSubject,
      emailProps,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({
        error: {
          message: err.message,
          code: err.code ?? "invalid_webhook",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
