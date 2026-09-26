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

export async function DELETE(request: Request) {
  try {
    // ---------------------------------
    // 1. Check logged-in user
    // ---------------------------------

    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // ---------------------------------
    // 2. Check admin role
    // ---------------------------------

    const { data: role, error: roleError } =
      await supabase.rpc("get_my_role");

    if (roleError || role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    // ---------------------------------
    // 3. Read investor ID
    // ---------------------------------

    const body = await request.json();

    const investorId =
      typeof body?.investorId === "string"
        ? body.investorId.trim()
        : "";

    if (!investorId) {
      return NextResponse.json(
        { error: "Investor ID is required." },
        { status: 400 }
      );
    }

    // ---------------------------------
    // 4. Find investor + Auth user ID
    // ---------------------------------

    const { data: investor, error: investorError } =
      await adminSupabase
        .from("investors")
        .select("id, user_id, name")
        .eq("id", investorId)
        .maybeSingle();

    if (investorError) {
      console.error(
        "Investor lookup error:",
        investorError
      );

      return NextResponse.json(
        { error: "Could not find investor." },
        { status: 500 }
      );
    }

    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found." },
        { status: 404 }
      );
    }

    // ---------------------------------
    // 5. Delete investor profile
    // ---------------------------------

    const { error: deleteInvestorError } =
      await adminSupabase
        .from("investors")
        .delete()
        .eq("id", investorId);

    if (deleteInvestorError) {
      console.error(
        "Investor deletion error:",
        deleteInvestorError
      );

      return NextResponse.json(
        {
          error:
            "Could not delete investor profile.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------
    // 6. Delete Auth account
    // ---------------------------------

    if (investor.user_id) {
      const { error: deleteAuthError } =
        await adminSupabase.auth.admin.deleteUser(
          investor.user_id
        );

      if (deleteAuthError) {
        console.error(
          "Auth user deletion error:",
          deleteAuthError
        );

        return NextResponse.json(
          {
            error:
              "Investor profile was deleted, but authentication account could not be removed.",
          },
          { status: 500 }
        );
      }
    }

    // ---------------------------------
    // 7. Success
    // ---------------------------------

    return NextResponse.json({
      success: true,
      message: "Investor account deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete investor unexpected error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}