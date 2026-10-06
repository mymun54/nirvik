import InvestmentChart from "../../components/InvestmentChart";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

type InvestorDirectoryItem = {
  serial_number: number;
  name: string | null;
};

type RefundedHistoryItem = {
  id: string;
  investor_id: string;
  refund_date: string;
};

type PaidHistoryItem = {
  id: string;
  investor_id: string;
  paid_date: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================
  // CURRENT INVESTOR
  // =========================

  const { data: investor, error } = await supabase
    .from("investors")
    .select(
        `
  id,
  serial_number,
  name,
  email,
  username,
  phone,
  address,
  total_investment,
  total_return,
  total_returned,
  due_amount,
  profit,
  is_active
  `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Investor dashboard error:", error);
  }

  if (!investor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-blue-950">
            Investor Account Not Found
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Your login account is active, but no investor profile is connected
            to this account yet.
          </p>
        </div>
      </main>
    );
  }

  if (!investor.is_active) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-red-700">
            Account Inactive
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Your investor account is currently inactive. Please contact NIRVIK
            administration.
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // REFUNDED + PAID HISTORY
  // ONLY CURRENT INVESTOR
  // =========================

  const [refundedResponse, paidResponse, directoryResponse] =
    await Promise.all([
      supabase
        .from("refunded_investors")
        .select("id, investor_id, refund_date")
        .eq("investor_id", investor.id)
        .order("refund_date", { ascending: false }),

      supabase
        .from("paid_investors")
        .select("id, investor_id, paid_date")
        .eq("investor_id", investor.id)
        .order("paid_date", { ascending: false }),

      supabase.rpc("get_investor_directory"),
    ]);

  if (refundedResponse.error) {
    console.error(
      "Refunded investors history error:",
      refundedResponse.error
    );
  }

  if (paidResponse.error) {
    console.error("Paid investors history error:", paidResponse.error);
  }

  if (directoryResponse.error) {
    console.error(
      "Investor directory error:",
      directoryResponse.error
    );
  }

  const refundedHistory: RefundedHistoryItem[] =
    (refundedResponse.data || []) as RefundedHistoryItem[];

  const paidHistory: PaidHistoryItem[] =
    (paidResponse.data || []) as PaidHistoryItem[];

  const directory: InvestorDirectoryItem[] =
    (directoryResponse.data || []) as InvestorDirectoryItem[];

  // =========================
  // ACCOUNTING VALUES
  // =========================

  const totalInvestment = Number(investor.total_investment || 0);
  const totalProfit = Number(investor.profit || 0);
  const totalAmountReceivable = Number(investor.total_return || 0);
  const totalAmountReturned = Number(investor.total_returned || 0);
  const outstandingAmount = Number(investor.due_amount || 0);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            HEADER
        ========================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Investor Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-black text-blue-950">
              Welcome, {investor.name}
            </h1>
          </div>

          <div className="rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Account
            </p>

            <p className="mt-1 font-bold text-slate-800">
              {investor.username || investor.email || user.email}
            </p>
          </div>
        </div>

        {/* =========================
            SUMMARY CARDS
        ========================= */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <SummaryCard
            title="Total Investment"
            value={totalInvestment}
          />

          <SummaryCard
            title="Total Profit"
            value={totalProfit}
          />

          <SummaryCard
            title="Total Amount Receivable"
            value={totalAmountReceivable}
          />

          <SummaryCard
            title="Total Amount Returned"
            value={totalAmountReturned}
          />

          <SummaryCard
            title="Outstanding Amount"
            value={outstandingAmount}
          />

        </div>

        {/* =========================
            PORTFOLIO GRAPH
        ========================= */}

        <section className="mt-8">
          <InvestmentChart
            totalInvestment={totalInvestment}
            totalProfit={totalProfit}
            totalReturned={totalAmountReturned}
            totalReturn={totalAmountReceivable}
            dueAmount={outstandingAmount}
          />
        </section>

        {/* =========================
            INVESTOR LIST
        ========================= */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-black text-blue-950">
                  Investor List
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current active investors.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-2">
                <span className="text-sm font-bold text-blue-700">
                  {directory.length} Investors
                </span>
              </div>

            </div>
          </div>

          {directory.length > 0 ? (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[500px] text-left">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      SL
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Name
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {directory.map((item, index) => (
                    <tr
                      key={`${item.serial_number}-${item.name}-${index}`}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        {item.serial_number}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-blue-950">
                        {item.name || "â€”"}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-400">
              No investors available.
            </div>
          )}

        </section>

        {/* =========================
            REFUNDED INVESTORS
        ========================= */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-black text-blue-950">
              Refunded Investors
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your refund records.
            </p>
          </div>

          {refundedHistory.length > 0 ? (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[600px] text-left">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Refund Date
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Serial No.
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Name
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {refundedHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.refund_date}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {investor.serial_number || "â€”"}
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-blue-950">
                        {investor.name}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-400">
              No refund history available yet.
            </div>
          )}

        </section>

        {/* =========================
            PAID INVESTORS
        ========================= */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-black text-blue-950">
              Paid Investors
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your paid records.
            </p>
          </div>

          {paidHistory.length > 0 ? (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[600px] text-left">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Paid Date
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Serial No.
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Name
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {paidHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.paid_date}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {investor.serial_number || "â€”"}
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-blue-950">
                        {investor.name}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-400">
              No paid history available yet.
            </div>
          )}

        </section>

      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number | string | null;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-2xl font-black text-blue-950">
        à§³{Number(value || 0).toLocaleString("en-BD")}
      </p>

    </div>
  );
}
