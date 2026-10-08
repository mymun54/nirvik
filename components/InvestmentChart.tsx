"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type InvestmentChartProps = {
  totalInvestment: number;
  totalProfit: number;
  totalReturned: number;
  totalReturn: number;
  dueAmount: number;
};

export default function InvestmentChart({
  totalInvestment,
  totalProfit,
  totalReturned,
  totalReturn,
  dueAmount,
}: InvestmentChartProps) {
  const data = [
    { name: "Total Investment", value: Number(totalInvestment) || 0 },
    { name: "Total Profit", value: Number(totalProfit) || 0 },
    { name: "Total Amount Returned", value: Number(totalReturned) || 0 },
    { name: "Total Amount Receivable", value: Number(totalReturn) || 0 },
    { name: "Outstanding Amount", value: Number(dueAmount) || 0 },
  ];

  const colors = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#9333ea",
    "#ef4444",
  ];

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-black text-blue-950">
          Portfolio Overview
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Your current investment and financial position.
        </p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `&#2547;${Number(value || 0).toLocaleString("en-BD")}`}
            />

            <Tooltip formatter={(value) => [`&#2547;${Number(value || 0).toLocaleString("en-BD")}`, "Amount"]} />

            <Bar
              dataKey="value"
              radius={[10, 10, 0, 0]}
              maxBarSize={70}
            >
              {data.map((_, index) => (
                <Cell
                  key={`portfolio-cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
