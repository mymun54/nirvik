"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Investor = {
  id: string;
  serial_number: number | null;
  name: string | null;
};

type RefundRecord = {
  id: string;
  investor_id: string;
  refund_date: string;
};

type PaidRecord = {
  id: string;
  investor_id: string;
  paid_date: string;
};

export default function InvestmentHistoryManager() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [refunded, setRefunded] = useState<RefundRecord[]>([]);
  const [paid, setPaid] = useState<PaidRecord[]>([]);

  const [refundInvestor, setRefundInvestor] = useState("");
  const [refundDate, setRefundDate] = useState("");

  const [paidInvestor, setPaidInvestor] = useState("");
  const [paidDate, setPaidDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRefundId, setEditingRefundId] = useState<string | null>(null);
  const [editingRefundDate, setEditingRefundDate] = useState("");
  const [editingPaidId, setEditingPaidId] = useState<string | null>(null);
  const [editingPaidDate, setEditingPaidDate] = useState("");

  async function loadData() {
    setLoading(true);

    const [
      investorsResponse,
      refundedResponse,
      paidResponse,
    ] = await Promise.all([
      supabase
        .from("investors")
        .select("id,serial_number,name")
        .eq("is_active", true)
        .order("serial_number", {
          ascending: true,
        }),

      supabase
        .from("refunded_investors")
        .select("id,investor_id,refund_date")
        .order("refund_date", {
          ascending: false,
        }),

      supabase
        .from("paid_investors")
        .select("id,investor_id,paid_date")
        .order("paid_date", {
          ascending: false,
        }),
    ]);

    if (!investorsResponse.error) {
      setInvestors(investorsResponse.data || []);
    }

    if (!refundedResponse.error) {
      setRefunded(
        (refundedResponse.data || []) as RefundRecord[]
      );
    }

    if (!paidResponse.error) {
      setPaid(
        (paidResponse.data || []) as PaidRecord[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addRefunded() {
    if (!refundInvestor || !refundDate) {
      alert("Investor এবং Refund Date select করুন");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("refunded_investors")
      .insert({
        investor_id: refundInvestor,
        refund_date: refundDate,
      });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setRefundInvestor("");
    setRefundDate("");

    await loadData();
  }

  async function addPaid() {
    if (!paidInvestor || !paidDate) {
      alert("Investor এবং Paid Date select করুন");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("paid_investors")
      .insert({
        investor_id: paidInvestor,
        paid_date: paidDate,
      });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setPaidInvestor("");
    setPaidDate("");

    await loadData();
  }


  function startEditRefunded(item: RefundRecord) { setEditingRefundId(item.id); setEditingRefundDate(item.refund_date); }
  function cancelEditRefunded() { setEditingRefundId(null); setEditingRefundDate(""); }
  async function updateRefunded(id: string) { if (!editingRefundDate) { alert("Refund Date is required."); return; } setSaving(true); const { error } = await supabase.from("refunded_investors").update({ refund_date: editingRefundDate }).eq("id", id); setSaving(false); if (error) { alert(error.message); return; } cancelEditRefunded(); await loadData(); }
  function startEditPaid(item: PaidRecord) { setEditingPaidId(item.id); setEditingPaidDate(item.paid_date); }
  function cancelEditPaid() { setEditingPaidId(null); setEditingPaidDate(""); }
  async function updatePaid(id: string) { if (!editingPaidDate) { alert("Paid Date is required."); return; } setSaving(true); const { error } = await supabase.from("paid_investors").update({ paid_date: editingPaidDate }).eq("id", id); setSaving(false); if (error) { alert(error.message); return; } cancelEditPaid(); await loadData(); }
  async function deleteRefunded(id: string) {
    if (
      !confirm(
        "এই refunded record delete করবেন?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("refunded_investors")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  async function deletePaid(id: string) {
    if (
      !confirm(
        "এই paid record delete করবেন?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("paid_investors")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  function investorName(id: string) {
    return (
      investors.find(
        (item) => item.id === id
      )?.name || "Unknown Investor"
    );
  }

  function investorSerial(id: string) {
    return (
      investors.find(
        (item) => item.id === id
      )?.serial_number ?? "-"
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Investment History
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage refunded and paid investors separately.
        </p>
      </div>

      {/* REFUNDED INVESTORS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-semibold text-slate-900">
            Refunded Investors
          </h3>

          <p className="text-sm text-slate-500">
            Investors who have received their refund.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={refundInvestor}
            onChange={(e) =>
              setRefundInvestor(e.target.value)
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none"
          >
            <option value="">
              Select Investor
            </option>

            {investors.map((investor) => (
              <option
                key={investor.id}
                value={investor.id}
              >
                {investor.serial_number} —{" "}
                {investor.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={refundDate}
            onChange={(e) =>
              setRefundDate(e.target.value)
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none"
          />

          <button
            onClick={addRefunded}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Add Refunded Investor"}
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-4 py-3">
                  Serial No.
                </th>

                <th className="px-4 py-3">
                  Name
                </th>

                <th className="px-4 py-3">
                  Refund Date
                </th>

                <th className="px-4 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {refunded.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100"
                >
                  <td className="px-4 py-3">
                    {investorSerial(
                      item.investor_id
                    )}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {investorName(
                      item.investor_id
                    )}
                  </td>

                  <td className="px-4 py-3">{editingRefundId === item.id ? <input type="date" value={editingRefundDate} onChange={(e) => setEditingRefundDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 outline-none" /> : item.refund_date}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-3">{editingRefundId === item.id ? <><button onClick={() => updateRefunded(item.id)} disabled={saving} className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50">{saving ? "Saving..." : "Save"}</button><button onClick={cancelEditRefunded} disabled={saving} className="text-sm font-medium text-slate-600 hover:underline disabled:opacity-50">Cancel</button></> : <><button onClick={() => startEditRefunded(item)} className="text-sm font-medium text-blue-600 hover:underline">Edit</button><button onClick={() => deleteRefunded(item.id)} className="text-sm font-medium text-red-600 hover:underline">Delete</button></>}</div></td>
                </tr>
              ))}

              {!loading &&
                refunded.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No refunded investors yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PAID INVESTORS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-semibold text-slate-900">
            Paid Investors
          </h3>

          <p className="text-sm text-slate-500">
            Investors who are marked as paid.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={paidInvestor}
            onChange={(e) =>
              setPaidInvestor(e.target.value)
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none"
          >
            <option value="">
              Select Investor
            </option>

            {investors.map((investor) => (
              <option
                key={investor.id}
                value={investor.id}
              >
                {investor.serial_number} —{" "}
                {investor.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={paidDate}
            onChange={(e) =>
              setPaidDate(e.target.value)
            }
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none"
          />

          <button
            onClick={addPaid}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Add Paid Investor"}
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-4 py-3">
                  Serial No.
                </th>

                <th className="px-4 py-3">
                  Name
                </th>

                <th className="px-4 py-3">
                  Paid Date
                </th>

                <th className="px-4 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {paid.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100"
                >
                  <td className="px-4 py-3">
                    {investorSerial(
                      item.investor_id
                    )}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {investorName(
                      item.investor_id
                    )}
                  </td>

                  <td className="px-4 py-3">{editingPaidId === item.id ? <input type="date" value={editingPaidDate} onChange={(e) => setEditingPaidDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 outline-none" /> : item.paid_date}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-3">{editingPaidId === item.id ? <><button onClick={() => updatePaid(item.id)} disabled={saving} className="text-sm font-medium text-blue-600 hover:underline">{saving ? "Saving..." : "Save"}</button><button onClick={cancelEditPaid} disabled={saving} className="text-sm font-medium text-slate-600 hover:underline disabled:opacity-50">Cancel</button></> : <><button onClick={() => startEditPaid(item)} className="text-sm font-medium text-blue-600 hover:underline">Edit</button><button onClick={() => deletePaid(item.id)} className="text-sm font-medium text-red-600 hover:underline">Delete</button></>}</div></td>
                </tr>
              ))}

              {!loading &&
                paid.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No paid investors yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}