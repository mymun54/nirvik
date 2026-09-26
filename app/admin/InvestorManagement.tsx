"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Investor = {
  id: string;
  user_id: string | null;
  serial_number: number;
  name: string;
  nid: string | null;
  email: string | null;
  username: string | null;
  total_investment: number;
  total_return: number;
  total_returned: number;
  due_amount: number;
  profit: number;
  phone: string | null;
  address: string | null;
  is_active: boolean;
};

const emptyForm = {
  serial_number: "1",
  name: "",
  nid: "",
  email: "",
  username: "",
  total_investment: "0",
  total_return: "0",
  total_returned: "0",
  due_amount: "0",
  profit: "0",
  phone: "",
  address: "",
  is_active: true,
};

export default function InvestorManagement() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadInvestors() {
    setLoading(true);

    const { data, error } = await supabase
      .from("investors")
      .select("*")
      .order("serial_number", { ascending: true });

    if (error) {
      setMessage(error.message);
    } else {
      setInvestors(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadInvestors();
  }, []);

  function updateField(
    field: keyof typeof emptyForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");

    if (!form.name.trim()) {
      setMessage("Investor name is required.");
      return;
    }

    setSaving(true);

    const payload = {
      serial_number: Number(form.serial_number) || 0,
      name: form.name.trim(),
      nid: form.nid.trim() || null,
      email: form.email.trim() || null,
      username: form.username.trim() || null,

      total_investment: Number(form.total_investment) || 0,
      total_return: Number(form.total_return) || 0,
      total_returned: Number(form.total_returned) || 0,
      due_amount: Number(form.due_amount) || 0,
      profit: Number(form.profit) || 0,

      phone: form.phone.trim() || null,
      address: form.address.trim() || null,

      is_active: form.is_active,
    };

    const result = editingId
      ? await supabase
          .from("investors")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("investors").insert(payload);

    if (result.error) {
      setMessage(result.error.message);
      setSaving(false);
      return;
    }

    setMessage(
      editingId
        ? "Investor updated successfully."
        : "Investor added successfully."
    );

    setForm(emptyForm);
    setEditingId(null);

    await loadInvestors();

    setSaving(false);
  }

  function handleEdit(investor: Investor) {
    setEditingId(investor.id);

    setForm({
      serial_number: String(investor.serial_number),
      name: investor.name,
      nid: investor.nid || "",
      email: investor.email || "",
      username: investor.username || "",

      total_investment: String(investor.total_investment || 0),
      total_return: String(investor.total_return || 0),
      total_returned: String(investor.total_returned || 0),
      due_amount: String(investor.due_amount || 0),
      profit: String(investor.profit || 0),

      phone: investor.phone || "",
      address: investor.address || "",

      is_active: investor.is_active,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this investor?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("investors")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Investor deleted successfully.");

    await loadInvestors();
  }

  async function toggleActive(investor: Investor) {
    const { error } = await supabase
      .from("investors")
      .update({
        is_active: !investor.is_active,
      })
      .eq("id", investor.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadInvestors();
  }

  return (
    <section className="mt-8 space-y-8">
      {/* FORM */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-800">
              Investor Management
            </p>

            <h2 className="mt-2 text-2xl font-bold text-blue-950">
              {editingId ? "Edit Investor" : "Add Investor"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage investor information and financial summary.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC INFORMATION */}

          <div>
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              Basic Information
            </h3>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Serial Number
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.serial_number}
                  onChange={(e) =>
                    updateField("serial_number", e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Full Name
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder="Investor name"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  NID
                </label>

                <input
                  value={form.nid}
                  onChange={(e) =>
                    updateField("nid", e.target.value)
                  }
                  placeholder="NID number"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Username
                </label>

                <input
                  value={form.username}
                  onChange={(e) =>
                    updateField("username", e.target.value)
                  }
                  placeholder="Investor username"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField("email", e.target.value)
                  }
                  placeholder="investor@email.com"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Phone
                </label>

                <input
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                  placeholder="Phone number"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  Address
                </label>

                <input
                  value={form.address}
                  onChange={(e) =>
                    updateField("address", e.target.value)
                  }
                  placeholder="Investor address"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>
            </div>
          </div>

          {/* FINANCIAL INFORMATION */}

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              Financial Summary
            </h3>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Total Investment
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.total_investment}
                  onChange={(e) =>
                    updateField(
                      "total_investment",
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Total Return
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.total_return}
                  onChange={(e) =>
                    updateField(
                      "total_return",
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Total Returned
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.total_returned}
                  onChange={(e) =>
                    updateField(
                      "total_returned",
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Due
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.due_amount}
                  onChange={(e) =>
                    updateField(
                      "due_amount",
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Profit
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={form.profit}
                  onChange={(e) =>
                    updateField("profit", e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                />
              </div>
            </div>
          </div>

          {/* STATUS */}

          <div className="border-t border-slate-200 pt-6">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  updateField("is_active", e.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-semibold text-slate-700">
                Active Investor
              </span>
            </label>
          </div>

          {message && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-950 px-7 py-3 font-bold text-white transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Investor"
                : "Add Investor"}
          </button>
        </form>
      </div>

      {/* INVESTOR LIST */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-blue-950">
            Investor List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Investors are displayed according to their serial number.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading investors...
          </div>
        ) : investors.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No investors added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-4">SL</th>
                  <th className="px-5 py-4">Investor</th>
                  <th className="px-5 py-4">Username</th>
                  <th className="px-5 py-4">Investment</th>
                  <th className="px-5 py-4">Return</th>
                  <th className="px-5 py-4">Returned</th>
                  <th className="px-5 py-4">Due</th>
                  <th className="px-5 py-4">Profit</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {investors.map((investor) => (
                  <tr
                    key={investor.id}
                    className="border-t border-slate-200"
                  >
                    <td className="px-5 py-5 font-bold">
                      {investor.serial_number}
                    </td>

                    <td className="px-5 py-5">
                      <div className="font-bold text-slate-900">
                        {investor.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {investor.email || "No email"}
                      </div>
                    </td>

                    <td className="px-5 py-5 text-slate-600">
                      {investor.username || "—"}
                    </td>

                    <td className="px-5 py-5 font-semibold">
                      ৳{Number(
                        investor.total_investment
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-5 font-semibold">
                      ৳{Number(
                        investor.total_return
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-5 font-semibold">
                      ৳{Number(
                        investor.total_returned
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-5 font-semibold text-red-600">
                      ৳{Number(
                        investor.due_amount
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-5 font-semibold text-emerald-600">
                      ৳{Number(
                        investor.profit
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-5">
                      <button
                        type="button"
                        onClick={() => toggleActive(investor)}
                        className={
                          investor.is_active
                            ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                            : "rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600"
                        }
                      >
                        {investor.is_active
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(investor)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(investor.id)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
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