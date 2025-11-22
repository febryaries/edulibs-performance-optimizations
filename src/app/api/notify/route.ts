import { NextResponse } from 'next/server';
import { EmailProps, sendEmail } from "@/lib/email-service";

// Define interface for the notification request payload
export interface NotifyRequestPayload {
  resource: {
    id: number | string;
    title: string;
  };
  recipients: {
    email: string;
    name?: string;
  }[];
}

export async function POST(req: Request) {
  try {
    // Parse the request body using the NotifyRequestPayload interface
    const payload = await req.json() as NotifyRequestPayload;
    const { resource, recipients } = payload;

    if (!resource) {
      return NextResponse.json({ error: 'Resource data is required' }, { status: 400 });
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 });
    }

    // Generate the resource URL
    const domain = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const resourceUrl = `${domain}/dashboard?resource_id=${resource.id}`;

    // Extract email addresses from recipients
    const recipientEmails = recipients.map(recipient => recipient.email);
    
    // Get the first recipient's name or use a default
    const recipientName = recipients[0]?.name || 'Evaluator';

    // Prepare email content
    // Just make a text for the resource changing the status 
    const emailProps: EmailProps = {
      previewText: `Resursă educațională în evaluare: ${resource.title}`,
      recipientName: recipientName,
      bodyText: `O resursă educațională a fost modificată și necesită atenția dumneavoastră. Vă rugăm să verificați resursa "${resource.title}" și să oferiți feedback.`,
      buttonText: 'Verifică resursa',
      buttonLink: resourceUrl,
    };

    // Send the email
    await sendEmail({
      to: recipientEmails,
      subject: `Resursă educațională în evaluare: ${resource.title}`,
      emailProps,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 });
  }
}
