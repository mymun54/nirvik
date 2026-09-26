import InvestmentChart from "../components/InvestmentChart";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

type InvestorDirectoryItem = {
  serial_number: number;
  username: string | null;
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
  // INVESTMENT HISTORY
  // =========================

  const { data: history, error: historyError } = await supabase
    .from("investment_history")
    .select(
      `
      id,
      project_name,
      investment_amount,
      return_amount,
      returned_amount,
      profit,
      status,
      investment_date
      `
    )
    .eq("investor_id", investor.id)
    .order("investment_date", { ascending: true });

  if (historyError) {
    console.error("Investment history error:", historyError);
  }

  // =========================
  // INVESTOR DIRECTORY
  // =========================

  const { data: investorDirectory, error: directoryError } =
    await supabase.rpc("get_investor_directory");

  if (directoryError) {
    console.error("Investor directory error:", directoryError);
  }

  const directory: InvestorDirectoryItem[] = investorDirectory || [];

  // =========================
  // ACCOUNTING VALUES
  // =========================

  const totalInvestment = Number(investor.total_investment || 0);
  const totalProfit = Number(investor.profit || 0);
  const totalAmountReceivable = Number(investor.total_return || 0);
  const totalAmountReturned = Number(investor.total_returned || 0);
  const outstandingAmount = Number(investor.due_amount || 0);

  // Amount still receivable from NIRVIK
  const accountsReceivable = Math.max(
    totalAmountReceivable - totalAmountReturned,
    0
  );

  // Amount payable by the investor
  const accountsPayable = 0;

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

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

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

          <SummaryCard
            title="Accounts receivable"
            value={accountsReceivable}
          />

          <SummaryCard
            title="Accounts payable"
            value={accountsPayable}
          />

        </div>

        {/* =========================
            INVESTMENT GRAPH
        ========================= */}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div>
            <h2 className="text-xl font-black text-blue-950">
              Investment Performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your investment and return history.
            </p>
          </div>

          <div className="mt-6">
            <InvestmentChart data={history || []} />
          </div>

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
                      Username
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {directory.map((item, index) => (
                    <tr
                      key={`${item.serial_number}-${item.username}-${index}`}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        {item.serial_number}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-blue-950">
                        {item.username || "—"}
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
            INVESTMENT HISTORY
        ========================= */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-black text-blue-950">
              Investment History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your investment records.
            </p>
          </div>

          {history && history.length > 0 ? (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px] text-left">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Project
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Investment
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Return
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Profit
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.investment_date}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.project_name}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        ৳
                        {Number(
                          item.investment_amount || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        ৳
                        {Number(
                          item.return_amount || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-green-700">
                        ৳
                        {Number(
                          item.profit || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                          {item.status}
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-400">
              No investment history available yet.
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
        ৳{Number(value || 0).toLocaleString()}
      </p>

    </div>
  );
}