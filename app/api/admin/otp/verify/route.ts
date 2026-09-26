import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawChallenge = cookieStore.get("nirvik_admin_login_challenge")?.value;

    if (!rawChallenge) {
      return NextResponse.json(
        { error: "Verification session expired. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: "Enter the 6-digit verification code." },
        { status: 400 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: challenge, error: challengeError } = await adminClient
      .from("admin_login_challenges")
      .select("id, user_id, expires_at, used_at, attempts")
      .eq("challenge_hash", sha256(rawChallenge))
      .maybeSingle();

    if (
      challengeError ||
      !challenge ||
      challenge.used_at ||
      new Date(challenge.expires_at).getTime() <= Date.now() ||
      Number(challenge.attempts) >= 5
    ) {
      return NextResponse.json(
        { error: "Verification session expired or locked. Please log in again." },
        { status: 401 }
      );
    }

    const { data: authUserData, error: authUserError } =
      await adminClient.auth.admin.getUserById(challenge.user_id);

    const email = authUserData.user?.email;

    if (authUserError || !email) {
      return NextResponse.json(
        { error: "Admin account could not be verified." },
        { status: 401 }
      );
    }

    const otpClient = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: otpData, error: otpError } = await otpClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (otpError || !otpData.user || otpData.user.id !== challenge.user_id) {
      const nextAttempts = Number(challenge.attempts) + 1;
      await adminClient
        .from("admin_login_challenges")
        .update({ attempts: nextAttempts })
        .eq("id", challenge.id)
        .is("used_at", null);

      return NextResponse.json(
        {
          error:
            nextAttempts >= 5
              ? "Too many incorrect codes. Please log in again."
              : "Invalid or expired verification code.",
        },
        { status: 401 }
      );
    }

    const { error: consumeError } = await adminClient
      .from("admin_login_challenges")
      .update({ used_at: new Date().toISOString() })
      .eq("id", challenge.id)
      .is("used_at", null);

    if (consumeError) {
      console.error("Admin challenge consume error:", consumeError);
      return NextResponse.json(
        { error: "Could not complete verification." },
        { status: 500 }
      );
    }

    const verifiedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const { error: verifiedError } = await adminClient
      .from("admin_otp_verifications")
      .upsert(
        { user_id: challenge.user_id, verified_until: verifiedUntil },
        { onConflict: "user_id" }
      );

    if (verifiedError) {
      console.error("Admin verification state error:", verifiedError);
      return NextResponse.json(
        { error: "Could not activate the secure admin session." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("nirvik_admin_login_challenge", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Admin OTP verify error:", error);
    return NextResponse.json(
      { error: "Verification failed." },
      { status: 500 }
    );
  }
}
