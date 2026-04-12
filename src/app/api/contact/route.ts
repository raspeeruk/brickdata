import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return NextResponse.redirect(new URL("/contact/thanks", req.url));
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BrickData <noreply@siftforms.com>",
      to: "andrew@twocores.com",
      subject: `BrickData Contact: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      reply_to: email,
    }),
  });

  return NextResponse.redirect(new URL("/contact/thanks", req.url));
}
