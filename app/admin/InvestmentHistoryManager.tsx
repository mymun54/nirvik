"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/supabase";

type Investor = {
  id: string;
  name: string;
  username: string | null;
};

type Investment = {
  id: string;
  investor_id: string;
  project_name: string;
  investment_amount: number;
  return_amount: number;
  returned_amount: number;
  profit: number;
  status: "active" | "completed" | "pending";
  investment_date: string;
};

const emptyForm = {
  investor_id: "",
  project_name: "",
  investment_amount: "",
  return_amount: "",
  returned_amount: "",
  profit: "",
  status: "active",
  investment_date: new Date().toISOString().split("T")[0],
};

export default function InvestmentHistoryManager() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const {
      data: investorData,
      error: investorError,
    } = await supabase
      .from("investors")
      .select("id, name, username")
      .order("serial_number", { ascending: true });

    if (investorError) {
      console.error(
        "INVESTOR LOAD ERROR:",
        JSON.stringify(investorError, null, 2)
      );

      setMessage(
        investorError.message || "Could not load investors."
      );
      setLoading(false);
      return;
    }

    const {
      data: investmentData,
      error: investmentError,
    } = await supabase
      .from("investment_history")
      .select("*")
      .order("investment_date", { ascending: false });

    if (investmentError) {
      console.error(
        "INVESTMENT HISTORY ERROR:",
        JSON.stringify(investmentError, null, 2)
      );

      setMessage(
        investmentError.message ||
          "Could not load investment history."
      );
      setLoading(false);
      return;
    }

    setInvestors((investorData || []) as Investor[]);
    setInvestments((investmentData || []) as Investment[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      investment_date: new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
    setMessage("");
  }

  function editInvestment(item: Investment) {
    setEditingId(item.id);

    setForm({
      investor_id: item.investor_id,
      project_name: item.project_name,
      investment_amount: String(item.investment_amount ?? ""),
      return_amount: String(item.return_amount ?? ""),
      returned_amount: String(item.returned_amount ?? ""),
      profit: String(item.profit ?? ""),
      status: item.status,
      investment_date: item.investment_date,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveInvestment(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    if (!form.investor_id) {
      setMessage("Please select an investor.");
      setSaving(false);
      return;
    }

    if (!form.project_name.trim()) {
      setMessage("Please enter a project name.");
      setSaving(false);
      return;
    }

    if (!form.investment_date) {
      setMessage("Please select an investment date.");
      setSaving(false);
      return;
    }

    const payload = {
      investor_id: form.investor_id,
      project_name: form.project_name.trim(),
      investment_amount: Number(form.investment_amount || 0),
      return_amount: Number(form.return_amount || 0),
      returned_amount: Number(form.returned_amount || 0),
      profit: Number(form.profit || 0),
      status: form.status,
      investment_date: form.investment_date,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const {
        error,
      } = await supabase
        .from("investment_history")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error(
          "INVESTMENT UPDATE ERROR:",
          JSON.stringify(error, null, 2)
        );

        setMessage(
          error.message || "Could not update investment."
        );
        setSaving(false);
        return;
      }

      setMessage("Investment history updated successfully.");
    } else {
      const {
        error,
      } = await supabase
        .from("investment_history")
        .insert(payload);

      if (error) {
        console.error(
          "INVESTMENT INSERT ERROR:",
          JSON.stringify(error, null, 2)
        );

        setMessage(
          error.message || "Could not add investment."
        );
        setSaving(false);
        return;
      }

      setMessage("Investment history added successfully.");
    }

    await loadData();

    setForm({
      ...emptyForm,
      investment_date: new Date().toISOString().split("T")[0],
    });

    setEditingId(null);
    setSaving(false);
  }

  async function deleteInvestment(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this investment record?"
    );

    if (!confirmed) return;

    setMessage("");

    const {
      error,
    } = await supabase
      .from("investment_history")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "INVESTMENT DELETE ERROR:",
        JSON.stringify(error, null, 2)
      );

      setMessage(
        error.message || "Could not delete investment."
      );
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setMessage("Investment record deleted.");
    await loadData();
  }

  function investorName(id: string) {
    const investor = investors.find(
      (item) => item.id === id
    );

    if (!investor) {
      return "Unknown Investor";
    }

    return investor.username
      ? `${investor.name} (${investor.username})`
      : investor.name;
  }

  function formatAmount(value: number | null | undefined) {
    return Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <section className="space-y-8">
      {/* Add / Edit Form */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-blue-950">
              {editingId
                ? "Edit Investment"
                : "Add Investment History"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage individual investor investment records.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form
          onSubmit={saveInvestment}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* Investor */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Investor
            </label>

            <select
              required
              value={form.investor_id}
              onChange={(e) =>
                updateField("investor_id", e.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-950"
            >
              <option value="">Select Investor</option>

              {investors.map((investor) => (
                <option
                  key={investor.id}
                  value={investor.id}
                >
                  {investor.name}
                  {investor.username
                    ? ` (${investor.username})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Project Name
            </label>

            <input
              required
              value={form.project_name}
              onChange={(e) =>
                updateField("project_name", e.target.value)
              }
              placeholder="Project name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
            />
          </div>

          {/* Investment */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Investment Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.investment_amount}
              onChange={(e) =>
                updateField(
                  "investment_amount",
                  e.target.value
                )
              }
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
            />
          </div>

          {/* Return */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Return Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.return_amount}
              onChange={(e) =>
                updateField(
                  "return_amount",
                  e.target.value
                )
              }
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
            />
          </div>

          {/* Returned */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Returned Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.returned_amount}
              onChange={(e) =>
                updateField(
                  "returned_amount",
                  e.target.value
                )
              }
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
            />
          </div>

          {/* Profit */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Profit
            </label>

            <input
              type="number"
              step="0.01"
              value={form.profit}
              onChange={(e) =>
                updateField("profit", e.target.value)
              }
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
            />

            <p className="mt-1 text-xs text-slate-400">
              Negative values are allowed for losses.
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Investment Date
            </label>

            <input
              type="date"
              required
              value={form.investment_date}
              onChange={(e) =>
                updateField(
                  "investment_date",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Status
            </label>

            <select
              value={form.status}
              onChange={(e) =>
                updateField("status", e.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-950"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-950 px-5 py-3 font-bold text-white transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Investment"
                : "Add Investment"}
            </button>
          </div>
        </form>

        {message && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
            {message}
          </div>
        )}
      </div>

      {/* Investment Records */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-2xl font-black text-blue-950">
            Investment Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            All investor investment history.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-400">
            Loading investment records...
          </div>
        ) : investments.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-400">
            No investment records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Investor
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Project
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Investment
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Return
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Returned
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Profit
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {investments.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {investorName(item.investor_id)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {item.project_name}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold">
                      ৳{formatAmount(item.investment_amount)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold">
                      ৳{formatAmount(item.return_amount)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold">
                      ৳{formatAmount(item.returned_amount)}
                    </td>

                    <td
                      className={`px-5 py-4 text-sm font-bold ${
                        Number(item.profit || 0) < 0
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      ৳{formatAmount(item.profit)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.investment_date}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editInvestment(item)
                          }
                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteInvestment(item.id)
                          }
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}