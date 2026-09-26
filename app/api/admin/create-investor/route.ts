import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "../../../../lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // Check current logged-in user
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in as an admin." },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: role, error: roleError } =
      await supabase.rpc("get_my_role");

    if (roleError || role !== "admin") {
      return NextResponse.json(
        { error: "Admin permission required." },
        { status: 403 }
      );
    }

    // Read form data
    const body = await request.json();

    const {
      serial_number,
      name,
      nid,
      email,
      username,
      password,
      total_investment,
      total_return,
      total_returned,
      due_amount,
      profit,
      phone,
      address,
      is_active,
    } = body;

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    const normalizedUsername =
      typeof username === "string"
        ? username.trim().toLowerCase()
        : "";

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Investor name is required." },
        { status: 400 }
      );
    }

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Investor email is required." },
        { status: 400 }
      );
    }

    if (!normalizedUsername) {
      return NextResponse.json(
        { error: "Investor username is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Investor password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Server-side Supabase client
    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check duplicate username in investors table
    const { data: existingUsername, error: usernameCheckError } =
      await adminSupabase
        .from("investors")
        .select("id, username")
        .eq("username", normalizedUsername)
        .maybeSingle();

    if (usernameCheckError) {
      console.error(
        "Username check error:",
        usernameCheckError
      );

      return NextResponse.json(
        { error: "Could not check investor username." },
        { status: 500 }
      );
    }

    if (existingUsername) {
      return NextResponse.json(
        {
          error:
            "This username is already in use. Please choose another username.",
        },
        { status: 409 }
      );
    }

    // Check duplicate email in investors table
    const { data: existingInvestorEmail, error: emailCheckError } =
      await adminSupabase
        .from("investors")
        .select("id, email")
        .eq("email", normalizedEmail)
        .maybeSingle();

    if (emailCheckError) {
      console.error(
        "Investor email check error:",
        emailCheckError
      );

      return NextResponse.json(
        { error: "Could not check investor email." },
        { status: 500 }
      );
    }

    if (existingInvestorEmail) {
      return NextResponse.json(
        {
          error:
            "This email is already used by an investor. Please use another email.",
        },
        { status: 409 }
      );
    }

    // Create Supabase Auth account
    const {
      data: authData,
      error: authError,
    } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error(
        "Auth account creation error:",
        authError
      );

      if (authError?.code === "email_exists") {
        return NextResponse.json(
          {
            error:
              "This email already exists in Supabase Auth. Please use another email.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Could not create investor login account.",
        },
        { status: 400 }
      );
    }

    const authUserId = authData.user.id;

    // Create investor profile
    const { error: profileError } =
      await adminSupabase
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
        "Investor profile creation error:",
        profileError
      );

      await adminSupabase.auth.admin.deleteUser(
        authUserId
      );

      return NextResponse.json(
        {
          error:
            "Could not create investor profile.",
        },
        { status: 500 }
      );
    }

    // Create canonical investor record
    const { data: investor, error: investorError } =
      await adminSupabase
        .from("investors")
        .insert({
          user_id: authUserId,
          serial_number: Number(serial_number) || 0,
          name: name.trim(),
          nid: nid?.trim() || null,
          email: normalizedEmail,
          username: normalizedUsername,
          total_investment:
            Number(total_investment) || 0,
          total_return:
            Number(total_return) || 0,
          total_returned:
            Number(total_returned) || 0,
          due_amount:
            Number(due_amount) || 0,
          profit:
            Number(profit) || 0,
          phone:
            phone?.trim() || null,
          address:
            address?.trim() || null,
          is_active:
            is_active !== false,
        })
        .select("*")
        .single();

    if (investorError) {
      console.error(
        "Investor record creation error:",
        investorError
      );

      // Roll back profile
      await adminSupabase
        .from("profiles")
        .delete()
        .eq("id", authUserId);

      // Roll back auth account
      await adminSupabase.auth.admin.deleteUser(
        authUserId
      );

      return NextResponse.json(
        {
          error:
            investorError.message ||
            "Could not create investor record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        investor,
        message: "Investor created successfully.",
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
        error:
          error instanceof Error
            ? error.message
            : "Could not create investor.",
      },
      { status: 500 }
    );
  }
}