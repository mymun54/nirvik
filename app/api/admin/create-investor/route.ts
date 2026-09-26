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
        {
          error: "Unauthorized.",
        },
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
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------
    // 3. Read request body
    // ---------------------------------

    const body = await request.json();

    const {
      name,
      email,
      username,
      password,
      nid,
      phone,
      address,
      serial_number,

      total_investment,
      total_return,
      total_returned,
      due_amount,
      profit,
    } = body;

    // ---------------------------------
    // 4. Validate required fields
    // ---------------------------------

    if (!name?.trim()) {
      return NextResponse.json(
        {
          error: "Investor name is required.",
        },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        {
          error: "Investor email is required.",
        },
        { status: 400 }
      );
    }

    if (!username?.trim()) {
      return NextResponse.json(
        {
          error: "Investor username is required.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          error: "Investor password is required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Investor password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------
    // 5. Normalize email + username
    // ---------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedUsername =
      username.trim().toLowerCase();

    // ---------------------------------
    // 6. Check duplicate username
    // ---------------------------------

    const {
      data: existingInvestor,
      error: usernameCheckError,
    } = await adminSupabase
      .from("investors")
      .select("id")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (usernameCheckError) {
      console.error(
        "Username check error:",
        usernameCheckError
      );

      return NextResponse.json(
        {
          error:
            "Could not verify username availability.",
        },
        { status: 500 }
      );
    }

    if (existingInvestor) {
      return NextResponse.json(
        {
          error: "This username is already in use.",
        },
        { status: 409 }
      );
    }

    // ---------------------------------
    // 7. Create Supabase Auth account
    // ---------------------------------

    const {
      data: authData,
      error: authError,
    } =
      await adminSupabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      console.error(
        "Auth account creation error:",
        authError
      );

      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Could not create investor authentication account.",
        },
        { status: 400 }
      );
    }

    const authUserId = authData.user.id;

    // ---------------------------------
    // 8. Create investor role profile
    // ---------------------------------

    const {
      error: profileError,
    } = await adminSupabase
      .from("profiles")
      .upsert(
        {
          id: authUserId,
          role: "investor",
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error(
        "Investor role profile creation error:",
        profileError
      );

      // Rollback Auth account
      await adminSupabase.auth.admin.deleteUser(
        authUserId
      );

      return NextResponse.json(
        {
          error:
            "Could not create investor access role.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------
    // 9. Create investor profile
    // ---------------------------------

    const {
      data: investor,
      error: investorError,
    } =
      await adminSupabase
        .from("investors")
        .insert({
          user_id: authUserId,

          serial_number:
            Number(serial_number || 0),

          name: name.trim(),

          nid:
            nid?.trim() || null,

          email: normalizedEmail,

          username: normalizedUsername,

          total_investment:
            Number(total_investment || 0),

          total_return:
            Number(total_return || 0),

          total_returned:
            Number(total_returned || 0),

          due_amount:
            Number(due_amount || 0),

          profit:
            Number(profit || 0),

          phone:
            phone?.trim() || null,

          address:
            address?.trim() || null,

          is_active: true,
        })
        .select()
        .single();

    // ---------------------------------
    // 10. Rollback if investor profile fails
    // ---------------------------------

    if (investorError || !investor) {
      console.error(
        "Investor profile creation error:",
        investorError
      );

      // Delete Auth user.
      // profiles row will also be removed
      // because profiles.id references auth.users(id)
      // with ON DELETE CASCADE.
      await adminSupabase.auth.admin.deleteUser(
        authUserId
      );

      return NextResponse.json(
        {
          error:
            investorError?.message ||
            "Could not create investor profile.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------
    // 11. Success
    // ---------------------------------

    return NextResponse.json(
      {
        success: true,
        investor,
        message:
          "Investor account created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create investor unexpected error:",
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