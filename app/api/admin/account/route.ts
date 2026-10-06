import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

async function getAdminUser() {
  const supabase =
    await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      role: null,
    };
  }

  const {
    data: role,
  } = await supabase.rpc(
    "get_my_role"
  );

  return {
    supabase,
    user,
    role,
  };
}

async function verifyPassword(
  email: string,
  password: string
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        apikey:
          process.env
            .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      },

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  return response.ok;
}

export async function PATCH(
  request: Request
) {
  try {
    const {
      user,
      role,
    } = await getAdminUser();

    if (
      !user ||
      role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Admin access required",
        },
        { status: 403 }
      );
    }

    const body =
      await request.json();

    const type = body.type;

    /* =========================
       CHANGE EMAIL
       ========================= */

    if (type === "email") {
      const newEmail =
        String(
          body.newEmail || ""
        )
          .trim()
          .toLowerCase();

      const currentPassword =
        String(
          body.currentPassword || ""
        );

      if (
        !newEmail ||
        !currentPassword
      ) {
        return NextResponse.json(
          {
            error:
              "New email and current password are required",
          },
          { status: 400 }
        );
      }

      const passwordValid =
        await verifyPassword(
          user.email!,
          currentPassword
        );

      if (!passwordValid) {
        return NextResponse.json(
          {
            error:
              "Current password is incorrect",
          },
          { status: 400 }
        );
      }

      const {
        error,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            email: newEmail,
            email_confirm: true,
          }
        );

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Admin email updated successfully",
      });
    }

    /* =========================
       CHANGE PASSWORD
       ========================= */

    if (type === "password") {
      const currentPassword =
        String(
          body.currentPassword || ""
        );

      const newPassword =
        String(
          body.newPassword || ""
        );

      if (
        !currentPassword ||
        !newPassword
      ) {
        return NextResponse.json(
          {
            error:
              "Current password and new password are required",
          },
          { status: 400 }
        );
      }

      if (
        newPassword.length < 6
      ) {
        return NextResponse.json(
          {
            error:
              "New password must contain at least 6 characters",
          },
          { status: 400 }
        );
      }

      const passwordValid =
        await verifyPassword(
          user.email!,
          currentPassword
        );

      if (!passwordValid) {
        return NextResponse.json(
          {
            error:
              "Current password is incorrect",
          },
          { status: 400 }
        );
      }

      const {
        error,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            password:
              newPassword,
          }
        );

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Admin password updated successfully",
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid account update type",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "Admin account update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update admin account",
      },
      { status: 500 }
    );
  }
}