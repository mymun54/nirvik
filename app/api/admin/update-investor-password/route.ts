import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "../../../../lib/supabase/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    const body = await request.json();

    const investorId =
      typeof body.investorId === "string"
        ? body.investorId
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const accessToken =
      typeof body.accessToken === "string"
        ? body.accessToken
        : "";

    if (!investorId) {
      return NextResponse.json(
        { error: "Investor ID is required." },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    let adminUser = null;

    if (accessToken) {
      const {
        data: { user },
        error: tokenError,
      } = await adminSupabase.auth.getUser(accessToken);

      if (!tokenError && user) {
        adminUser = user;
      }
    }

    if (!adminUser) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        adminUser = user;
      }
    }

    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { data: investor, error: investorError } =
      await adminSupabase
        .from("investors")
        .select("id, user_id, name, email")
        .eq("id", investorId)
        .maybeSingle();

    if (investorError) {
      return NextResponse.json(
        { error: investorError.message },
        { status: 500 }
      );
    }

    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found." },
        { status: 404 }
      );
    }

    if (!investor.user_id) {
      return NextResponse.json(
        {
          error:
            "This investor does not have a linked authentication account.",
        },
        { status: 400 }
      );
    }

    const { error: updateAuthError } =
      await adminSupabase.auth.admin.updateUserById(
        investor.user_id,
        {
          password: newPassword,
        }
      );

    if (updateAuthError) {
      return NextResponse.json(
        { error: updateAuthError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Investor password updated successfully.",
    });
  } catch (error) {
    console.error("Update investor password error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update investor password.",
      },
      { status: 500 }
    );
  }
}