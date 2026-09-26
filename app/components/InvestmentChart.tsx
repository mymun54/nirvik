"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type InvestmentHistory = {
  investment_date: string;
  investment_amount: number | string | null;
  return_amount: number | string | null;
  returned_amount?: number | string | null;
  profit: number | string | null;
};

export default function InvestmentChart({
  data,
}: {
  data: InvestmentHistory[];
}) {
  // =========================
  // BUILD PORTFOLIO DATA
  // =========================

  let cumulativeInvestment = 0;
  let cumulativeProfit = 0;
  let cumulativeReturned = 0;

  const chartData = [...data]
    .sort(
      (a, b) =>
        new Date(a.investment_date).getTime() -
        new Date(b.investment_date).getTime()
    )
    .map((item) => {
      const investment = Number(item.investment_amount || 0);
      const profit = Number(item.profit || 0);
      const returned = Number(item.returned_amount || 0);

      cumulativeInvestment += investment;
      cumulativeProfit += profit;
      cumulativeReturned += returned;

      // Current portfolio value
      const portfolioValue =
        cumulativeInvestment + cumulativeProfit - cumulativeReturned;

      return {
        date: new Date(item.investment_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),

        investment: cumulativeInvestment,

        profit: cumulativeProfit,

        returned: cumulativeReturned,

        portfolioValue: Math.max(portfolioValue, 0),
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-50">
        <p className="text-sm font-semibold text-slate-400">
          No investment data available for portfolio chart.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* =========================
          PORTFOLIO GROWTH
      ========================= */}

      <div>
        <div className="mb-4">
          <h3 className="text-lg font-black text-blue-950">
            Portfolio Growth
          </h3>

          <p className="text-sm text-slate-500">
            Your portfolio value based on investment, profit and returned amount.
          </p>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  `৳${Number(value).toLocaleString()}`
                }
              />

              <Tooltip
                formatter={(value, name) => [
                  `৳${Number(value || 0).toLocaleString()}`,
                  name === "portfolioValue"
                    ? "Portfolio Value"
                    : name === "investment"
                    ? "Investment"
                    : name === "profit"
                    ? "Profit"
                    : "Returned",
                ]}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="portfolioValue"
                name="Portfolio Value"
                strokeWidth={4}
                dot={{ r: 4 }}
                activeDot={{ r: 7 }}
              />

              <Line
                type="monotone"
                dataKey="investment"
                name="Investment"
                strokeWidth={2}
                dot={{ r: 3 }}
              />

              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* =========================
          PORTFOLIO SUMMARY
      ========================= */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Invested
          </p>

          <p className="mt-2 text-xl font-black text-blue-950">
            ৳
            {chartData[
              chartData.length - 1
            ].investment.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Profit
          </p>

          <p className="mt-2 text-xl font-black text-green-700">
            ৳
            {chartData[
              chartData.length - 1
            ].profit.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
            Current Portfolio
          </p>

          <p className="mt-2 text-xl font-black text-blue-950">
            ৳
            {chartData[
              chartData.length - 1
            ].portfolioValue.toLocaleString()}
          </p>
        </div>

      </div>

    </div>
  );
}