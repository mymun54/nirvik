import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.NIRVIK_SMTP_USER!,
    pass: process.env.NIRVIK_SMTP_PASS!,
  },
});

function hashOtp(value: string) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const accessToken =
      typeof body?.accessToken === "string"
        ? body.accessToken.trim()
        : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token." },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("ADMIN OTP USER ERROR:", userError);

      return NextResponse.json(
        { error: "Invalid authentication session." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error("ADMIN OTP PROFILE ERROR:", profileError);

      return NextResponse.json(
        { error: "Could not verify admin profile." },
        { status: 500 }
      );
    }

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const email = user.email;

    if (!email) {
      return NextResponse.json(
        { error: "Admin email address not found." },
        { status: 400 }
      );
    }

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const otpHash = hashOtp(otp);

    const challengeToken = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    const { error: cleanupError } =
      await supabaseAdmin
        .from("admin_login_challenges")
        .delete()
        .eq("user_id", user.id);

    if (cleanupError) {
      console.error(
        "ADMIN OTP CLEANUP ERROR:",
        cleanupError
      );
    }

    const { error: insertError } =
      await supabaseAdmin
        .from("admin_login_challenges")
        .insert({
          user_id: user.id,
          challenge_hash: challengeToken,
          expires_at: expiresAt,
          attempts: 0,
          used_at: null,
        });

    if (insertError) {
      console.error(
        "ADMIN OTP INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        { error: "Could not create verification challenge." },
        { status: 500 }
      );
    }

    try {
      await transporter.sendMail({
        from: `"NIRVIK" <${process.env.NIRVIK_SMTP_USER}>`,
        to: email,
        subject: "NIRVIK Admin Verification Code",
        text: `Your NIRVIK admin verification code is ${otp}.

This code expires in 10 minutes.

If you did not attempt to sign in to the NIRVIK Admin Panel, ignore this email.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;">
            <h2 style="color:#172554;">NIRVIK Admin Verification</h2>

            <p>Your verification code is:</p>

            <div style="font-size:36px;font-weight:700;letter-spacing:10px;padding:20px 0;color:#172554;">
              ${otp}
            </div>

            <p>This code expires in <strong>10 minutes</strong>.</p>

            <p style="color:#64748b;font-size:13px;">
              If you did not attempt to sign in to the NIRVIK Admin Panel,
              you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error(
        "ADMIN OTP EMAIL ERROR:",
        mailError
      );

      await supabaseAdmin
        .from("admin_login_challenges")
        .delete()
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          error:
            "Could not send Gmail verification code. Check SMTP settings.",
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message:
        "A 6-digit verification code has been sent to your admin Gmail.",
    });

    response.cookies.set(
      "nirvik_admin_challenge",
      challengeToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 10 * 60,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "ADMIN OTP START UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}