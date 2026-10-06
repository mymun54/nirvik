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

export async function POST(request: Request) {
  try {
    const supabase =
      await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      data: roleData,
      error: roleError,
    } = await supabase.rpc("get_my_role");

    if (
      roleError ||
      roleData !== "admin"
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(
      body.name || ""
    ).trim();

    const symbol = String(
      body.symbol || ""
    ).trim();

    const price = Number(body.price);

    const changePercent = Number(
      body.change_percent
    );

    const displayOrder = Number(
      body.display_order || 0
    );

    const direction =
      body.direction === "down"
        ? "down"
        : "up";

    if (!name || !symbol) {
      return NextResponse.json(
        {
          error:
            "Name and symbol are required",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price)) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(changePercent)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid change percentage",
        },
        { status: 400 }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("market_tickers")
      .insert({
        name,
        symbol,
        price,
        change_percent:
          Math.abs(changePercent),
        direction,
        display_order:
          Number.isFinite(displayOrder)
            ? displayOrder
            : 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Market ticker POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to add market item",
      },
      { status: 500 }
    );
  }
}