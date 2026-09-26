"use client";

import InvestmentHistoryManager from "./InvestmentHistoryManager";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/supabase";

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

type Project = {
  id: string;
  name: string;
  location: string | null;
  sector: string | null;
  description: string | null;
  status: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
};

type Ticker = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change_percent: number;
  direction: "up" | "down";
  is_active: boolean;
  display_order: number;
};

export default function AdminPanel() {
  const [tab, setTab] = useState<
    | "overview"
    | "investors"
    | "projects"
    | "market"
    | "website"
    | "account"
    | "investment-history"
  >("overview");

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [editingInvestorId, setEditingInvestorId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);

  const [message, setMessage] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);

  /* =========================
     ADMIN ACCOUNT
  ========================= */

  const [currentEmail, setCurrentEmail] = useState("");

  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordOtp, setPasswordOtp] = useState("");
  const [passwordOtpStep, setPasswordOtpStep] = useState(false);

  /* =========================
     INVESTOR FORM
  ========================= */

  const [investorForm, setInvestorForm] = useState({
    serial_number: "1",
    name: "",
    nid: "",
    email: "",
    username: "",
    password: "",
    total_investment: "0",
    total_return: "0",
    total_returned: "0",
    due_amount: "0",
    profit: "0",
    phone: "",
    address: "",
  });

  /* =========================
     PROJECT FORM
  ========================= */

  const [projectForm, setProjectForm] = useState({
    name: "",
    location: "",
    sector: "",
    description: "",
    status: "Active",
    image_url: "",
    display_order: "0",
  });

  /* =========================
     MARKET FORM
  ========================= */

  const [tickerForm, setTickerForm] = useState({
    name: "",
    symbol: "",
    price: "0",
    change_percent: "0",
    direction: "up" as "up" | "down",
    display_order: "0",
  });

  const [editingTickerId, setEditingTickerId] =
    useState<string | null>(null);

  /* =========================
     WEBSITE FORM
  ========================= */

  const [siteForm, setSiteForm] = useState({
    site_name: "",
    tagline: "",
    about_text: "",
    mission_text: "",
    vision_text: "",
    location: "",
    phone: "",
    email: "",
  });

  /* =========================
     LOAD ADMIN ACCOUNT
  ========================= */

  async function loadAdminAccount() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      setCurrentEmail(user.email);
    }
  }

  /* =========================
     LOAD ALL DATA
  ========================= */

  async function loadAll() {
    setMessage("");

    const [
      investorsResult,
      projectsResult,
      tickersResult,
      siteResult,
    ] = await Promise.all([
      supabase
        .from("investors")
        .select("*")
        .order("serial_number", {
          ascending: true,
        }),

      supabase
        .from("projects")
        .select("*")
        .order("display_order", {
          ascending: true,
        }),

      supabase
        .from("market_tickers")
        .select("*")
        .order("display_order", {
          ascending: true,
        }),

      supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle(),
    ]);

    const errors: string[] = [];

    if (investorsResult.error) {
      errors.push(
        `Investor: ${investorsResult.error.message}`
      );
    }

    if (projectsResult.error) {
      errors.push(
        `Project: ${projectsResult.error.message}`
      );
    }

    if (tickersResult.error) {
      errors.push(
        `Market: ${tickersResult.error.message}`
      );
    }

    if (siteResult.error) {
      errors.push(
        `Website: ${siteResult.error.message}`
      );
    }

    if (errors.length > 0) {
      setMessage(errors.join(" | "));
    }

    setInvestors(
      (investorsResult.data || []).map((item) => ({
        ...item,
        total_investment: Number(
          item.total_investment
        ),
        total_return: Number(item.total_return),
        total_returned: Number(
          item.total_returned
        ),
        due_amount: Number(item.due_amount),
        profit: Number(item.profit),
      }))
    );

    setProjects(projectsResult.data || []);

    setTickers(
      (tickersResult.data || []).map((item) => ({
        ...item,
        price: Number(item.price),
        change_percent: Number(
          item.change_percent
        ),
      }))
    );

    if (siteResult.data) {
      setSiteForm({
        site_name:
          siteResult.data.site_name || "",
        tagline:
          siteResult.data.tagline || "",
        about_text:
          siteResult.data.about_text || "",
        mission_text:
          siteResult.data.mission_text || "",
        vision_text:
          siteResult.data.vision_text || "",
        location:
          siteResult.data.location || "",
        phone:
          siteResult.data.phone || "",
        email:
          siteResult.data.email || "",
      });
    }
  }

  useEffect(() => {
    loadAll();
    loadAdminAccount();
  }, []);

  /* =========================
     CHANGE ADMIN EMAIL
  ========================= */

  async function changeAdminEmail(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");

    const newEmail =
      emailForm.newEmail.trim().toLowerCase();

    const currentPassword =
      emailForm.currentPassword;

    if (!newEmail) {
      setMessage("New admin email is required.");
      return;
    }

    if (!currentPassword) {
      setMessage(
        "Current password is required."
      );
      return;
    }

    if (
      currentEmail &&
      newEmail === currentEmail.toLowerCase()
    ) {
      setMessage(
        "New email must be different from the current email."
      );
      return;
    }

    setAccountLoading(true);

    try {
      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: currentPassword,
        });

      if (verifyError) {
        setMessage(
          "Current password is incorrect."
        );
        return;
      }

      const { error } =
        await supabase.auth.updateUser({
          email: newEmail,
        });

      if (error) {
        setMessage(
          `Could not change admin email: ${error.message}`
        );
        return;
      }

      setMessage(
        "Email change request sent. Please complete the email confirmation from the required inbox(es)."
      );

      setEmailForm({
        newEmail: "",
        currentPassword: "",
      });

      await loadAdminAccount();
    } finally {
      setAccountLoading(false);
    }
  }

  /* =========================
     CHANGE ADMIN PASSWORD
  ========================= */

  async function changeAdminPassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");

    const currentPassword = passwordForm.currentPassword;
    const newPassword = passwordForm.newPassword;
    const confirmPassword = passwordForm.confirmPassword;

    if (!currentPassword) {
      setMessage("Current password is required.");
      return;
    }

    if (!newPassword) {
      setMessage("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setMessage("New password must be different from the current password.");
      return;
    }

    setAccountLoading(true);

    try {
      if (!passwordOtpStep) {
        const { error: verifyError } =
          await supabase.auth.signInWithPassword({
            email: currentEmail,
            password: currentPassword,
          });

        if (verifyError) {
          setMessage("Current password is incorrect.");
          return;
        }

        const { error: reauthError } =
          await supabase.auth.reauthenticate();

        if (reauthError) {
          setMessage(
            `Could not send Gmail verification code: ${reauthError.message}`
          );
          return;
        }

        setPasswordOtp("");
        setPasswordOtpStep(true);
        setMessage(
          "A 6-digit verification code has been sent to the admin Gmail."
        );
        return;
      }

      if (!/^\d{6}$/.test(passwordOtp.trim())) {
        setMessage("Enter the 6-digit Gmail verification code.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        nonce: passwordOtp.trim(),
      });

      if (error) {
        setMessage(
          `Could not change password: ${error.message}`
        );
        return;
      }

      setMessage("Admin password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordOtp("");
      setPasswordOtpStep(false);
    } finally {
      setAccountLoading(false);
    }
  }

  /* =========================
     INVESTOR - ADD
  ========================= */

  async function addInvestor(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");

    if (!investorForm.name.trim()) {
      setMessage("Investor name is required.");
      return;
    }

    if (!investorForm.email.trim()) {
      setMessage("Investor email is required.");
      return;
    }

    if (!investorForm.username.trim()) {
      setMessage("Investor username is required.");
      return;
    }

    if (!investorForm.password) {
      setMessage("Investor password is required.");
      return;
    }

    if (investorForm.password.length < 8) {
      setMessage(
        "Investor password must be at least 8 characters."
      );
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/create-investor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serial_number: Number(
              investorForm.serial_number
            ),
            name: investorForm.name.trim(),
            nid:
              investorForm.nid.trim() || null,
            email: investorForm.email.trim(),
            username:
              investorForm.username.trim(),
            password: investorForm.password,
            total_investment: Number(
              investorForm.total_investment
            ),
            total_return: Number(
              investorForm.total_return
            ),
            total_returned: Number(
              investorForm.total_returned
            ),
            due_amount: Number(
              investorForm.due_amount
            ),
            profit: Number(
              investorForm.profit
            ),
            phone:
              investorForm.phone.trim() || null,
            address:
              investorForm.address.trim() || null,
            is_active: true,
          }),
        }
      );

      const result =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(
          result.error ||
            "Could not add investor."
        );
        return;
      }

      setMessage(
        "Investor added successfully."
      );

      setInvestorForm({
        serial_number: "1",
        name: "",
        nid: "",
        email: "",
        username: "",
        password: "",
        total_investment: "0",
        total_return: "0",
        total_returned: "0",
        due_amount: "0",
        profit: "0",
        phone: "",
        address: "",
      });

      await loadAll();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not add investor."
      );
    }
  }

  /* =========================
     INVESTOR - VIEW
  ========================= */

  function viewInvestor(investor: Investor) {
    setSelectedInvestor(investor);
    setEditingInvestorId(null);
    setMessage("");
  }

  /* =========================
     INVESTOR - START EDIT
  ========================= */

  function startEditInvestor(investor: Investor) {
    setEditingInvestorId(investor.id);
    setSelectedInvestor(null);
    setInvestorForm({
      serial_number: String(investor.serial_number),
      name: investor.name || "",
      nid: investor.nid || "",
      email: investor.email || "",
      username: investor.username || "",
      password: "",
      total_investment: String(investor.total_investment ?? 0),
      total_return: String(investor.total_return ?? 0),
      total_returned: String(investor.total_returned ?? 0),
      due_amount: String(investor.due_amount ?? 0),
      profit: String(investor.profit ?? 0),
      phone: investor.phone || "",
      address: investor.address || "",
    });
    setMessage("");
  }

  /* =========================
     INVESTOR - CANCEL EDIT
  ========================= */

  function cancelEditInvestor() {
    setEditingInvestorId(null);
    setInvestorForm({
      serial_number: "1",
      name: "",
      nid: "",
      email: "",
      username: "",
      password: "",
      total_investment: "0",
      total_return: "0",
      total_returned: "0",
      due_amount: "0",
      profit: "0",
      phone: "",
      address: "",
    });
    setMessage("");
  }

  /* =========================
     INVESTOR - UPDATE
  ========================= */

  async function updateInvestor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingInvestorId) return;
    setMessage("");

    if (!investorForm.name.trim()) {
      setMessage("Investor name is required.");
      return;
    }

    if (!investorForm.email.trim()) {
      setMessage("Investor email is required.");
      return;
    }

    if (!investorForm.username.trim()) {
      setMessage("Investor username is required.");
      return;
    }

    const numericValues = [
      investorForm.serial_number,
      investorForm.total_investment,
      investorForm.total_return,
      investorForm.total_returned,
      investorForm.due_amount,
      investorForm.profit,
    ].map(Number);

    if (numericValues.some((value) => !Number.isFinite(value))) {
      setMessage("Investor numeric values must be valid numbers.");
      return;
    }

    const { error } = await supabase
      .from("investors")
      .update({
        serial_number: numericValues[0],
        name: investorForm.name.trim(),
        nid: investorForm.nid.trim() || null,
        email: investorForm.email.trim().toLowerCase(),
        username: investorForm.username.trim().toLowerCase(),
        total_investment: numericValues[1],
        total_return: numericValues[2],
        total_returned: numericValues[3],
        due_amount: numericValues[4],
        profit: numericValues[5],
        phone: investorForm.phone.trim() || null,
        address: investorForm.address.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingInvestorId);

    if (error) {
      setMessage(`Could not update investor: ${error.message}`);
      return;
    }

    setMessage("Investor data updated successfully.");
    cancelEditInvestor();
    await loadAll();
  }

  /* =========================
     INVESTOR - DELETE
  ========================= */

  async function deleteInvestor(id: string) {
    const confirmed = window.confirm(
      "Delete this investor account permanently?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/delete-investor",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            investorId: id,
          }),
        }
      );

      const result =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(
          result.error ||
            "Could not delete investor."
        );
        return;
      }

      setMessage(
        "Investor account deleted successfully."
      );

      await loadAll();
    } catch (error) {
      console.error(
        "Delete investor error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete investor."
      );
    }
  }

  /* =========================
     PROJECT - ADD
  ========================= */

  async function addProject(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");

    if (!projectForm.name.trim()) {
      setMessage("Project name is required.");
      return;
    }

    const displayOrder = Number(
      projectForm.display_order
    );

    if (!Number.isFinite(displayOrder)) {
      setMessage(
        "Display order must be a valid number."
      );
      return;
    }

    const { error } = await supabase
      .from("projects")
      .insert({
        name: projectForm.name.trim(),
        location:
          projectForm.location.trim() || null,
        sector:
          projectForm.sector.trim() || null,
        description:
          projectForm.description.trim() || null,
        status:
          projectForm.status.trim() || "Active",
        image_url:
          projectForm.image_url.trim() || null,
        display_order: displayOrder,
        is_active: true,
      });

    if (error) {
      setMessage(
        `Could not add project: ${error.message}`
      );
      return;
    }

    setMessage(
      "Project added successfully."
    );

    setProjectForm({
      name: "",
      location: "",
      sector: "",
      description: "",
      status: "Active",
      image_url: "",
      display_order: "0",
    });

    await loadAll();
  }

  /* =========================
     PROJECT - DELETE
  ========================= */

  async function deleteProject(id: string) {
    const confirmed = window.confirm(
      "Delete this project?"
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(
        `Could not delete project: ${error.message}`
      );
      return;
    }

    setMessage(
      "Project deleted successfully."
    );

    await loadAll();
  }

  /* =========================
     MARKET - ADD
  ========================= */

  async function addTicker(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");

    if (!tickerForm.name.trim()) {
      setMessage("Market name is required.");
      return;
    }

    if (!tickerForm.symbol.trim()) {
      setMessage("Market symbol is required.");
      return;
    }

    const price = Number(tickerForm.price);
    const changePercent = Number(
      tickerForm.change_percent
    );
    const displayOrder = Number(
      tickerForm.display_order
    );

    if (!Number.isFinite(price)) {
      setMessage(
        "Price must be a valid number."
      );
      return;
    }

    if (!Number.isFinite(changePercent)) {
      setMessage(
        "Change percentage must be a valid number."
      );
      return;
    }

    if (!Number.isFinite(displayOrder)) {
      setMessage(
        "Display order must be a valid number."
      );
      return;
    }

    const { error } = await supabase
      .from("market_tickers")
      .insert({
        name: tickerForm.name.trim(),
        symbol: tickerForm.symbol.trim(),
        price,
        change_percent: Math.abs(
          changePercent
        ),
        direction: tickerForm.direction,
        display_order: displayOrder,
        is_active: true,
      });

    if (error) {
      setMessage(
        `Could not add market ticker: ${error.message}`
      );
      return;
    }

    setMessage(
      "Market ticker added successfully."
    );

    setTickerForm({
      name: "",
      symbol: "",
      price: "0",
      change_percent: "0",
      direction: "up",
      display_order: "0",
    });

    await loadAll();
  }

  /* =========================
     MARKET - START EDIT
  ========================= */

  function startEditTicker(ticker: Ticker) {
    setEditingTickerId(ticker.id);

    setTickerForm({
      name: ticker.name,
      symbol: ticker.symbol,
      price: String(ticker.price),
      change_percent: String(
        Math.abs(ticker.change_percent)
      ),
      direction: ticker.direction,
      display_order: String(
        ticker.display_order
      ),
    });

    setMessage("");
  }

  /* =========================
     MARKET - CANCEL EDIT
  ========================= */

  function cancelEditTicker() {
    setEditingTickerId(null);

    setTickerForm({
      name: "",
      symbol: "",
      price: "0",
      change_percent: "0",
      direction: "up",
      display_order: "0",
    });

    setMessage("");
  }

  /* =========================
     MARKET - UPDATE
  ========================= */

  async function updateTicker(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!editingTickerId) return;

    setMessage("");

    if (!tickerForm.name.trim()) {
      setMessage("Market name is required.");
      return;
    }

    if (!tickerForm.symbol.trim()) {
      setMessage("Market symbol is required.");
      return;
    }

    const price = Number(tickerForm.price);
    const changePercent = Number(
      tickerForm.change_percent
    );
    const displayOrder = Number(
      tickerForm.display_order
    );

    if (!Number.isFinite(price)) {
      setMessage(
        "Price must be a valid number."
      );
      return;
    }

    if (!Number.isFinite(changePercent)) {
      setMessage(
        "Change percentage must be a valid number."
      );
      return;
    }

    if (!Number.isFinite(displayOrder)) {
      setMessage(
        "Display order must be a valid number."
      );
      return;
    }

    const { error } = await supabase
      .from("market_tickers")
      .update({
        name: tickerForm.name.trim(),
        symbol: tickerForm.symbol.trim(),
        price,
        change_percent: Math.abs(
          changePercent
        ),
        direction: tickerForm.direction,
        display_order: displayOrder,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", editingTickerId);

    if (error) {
      setMessage(
        `Could not update market ticker: ${error.message}`
      );
      return;
    }

    setMessage(
      "Market ticker updated successfully."
    );

    cancelEditTicker();

    await loadAll();
  }

  /* =========================
     MARKET - DELETE
  ========================= */

  async function deleteTicker(id: string) {
    const confirmed = window.confirm(
      "Delete this market ticker?"
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("market_tickers")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(
        `Could not delete market ticker: ${error.message}`
      );
      return;
    }

    setMessage(
      "Market ticker deleted successfully."
    );

    if (editingTickerId === id) {
      cancelEditTicker();
    }

    await loadAll();
  }

  /* =========================
     MARKET - ACTIVE / HIDE
  ========================= */

  async function toggleTicker(ticker: Ticker) {
    setMessage("");

    const { error } = await supabase
      .from("market_tickers")
      .update({
        is_active: !ticker.is_active,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", ticker.id);

    if (error) {
      setMessage(
        `Could not change market status: ${error.message}`
      );
      return;
    }

    setMessage(
      ticker.is_active
        ? "Market item hidden from public website."
        : "Market item activated on public website."
    );

    await loadAll();
  }

  /* =========================
     WEBSITE
  ========================= */

  async function saveWebsite(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");

    const {
      data: existing,
      error: findError,
    } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (findError) {
      setMessage(
        `Could not load site settings: ${findError.message}`
      );
      return;
    }

    if (!existing) {
      setMessage(
        "Site settings row does not exist."
      );
      return;
    }

    const { error } = await supabase
      .from("site_settings")
      .update({
        site_name:
          siteForm.site_name.trim(),
        tagline:
          siteForm.tagline.trim(),
        about_text:
          siteForm.about_text,
        mission_text:
          siteForm.mission_text,
        vision_text:
          siteForm.vision_text,
        location:
          siteForm.location,
        phone:
          siteForm.phone,
        email:
          siteForm.email,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      setMessage(
        `Could not save website content: ${error.message}`
      );
      return;
    }

    setMessage(
      "Website content updated successfully."
    );

    await loadAll();
  }

  /* =========================
     LOGOUT
  ========================= */

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    await supabase.auth.signOut({ scope: "local" });

    window.location.replace(
      "/admin/login"
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-900">
              NIRVIK
            </p>

            <h1 className="mt-1 text-2xl font-black text-blue-950">
              Administration
            </h1>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold hover:bg-slate-100"
          >
            Logout
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* TABS */}

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

          {[
            ["overview", "Overview"],
            ["investors", "Investors"],
            ["projects", "Projects"],
            ["market", "Market Live"],
            ["website", "Website"],
            ["account", "Admin Account"],
            [
              "investment-history",
              "Investment History",
            ],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() =>
                setTab(key as typeof tab)
              }
              className={
                tab === key
                  ? "rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white"
                  : "rounded-xl px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
              }
            >
              {label}
            </button>
          ))}

        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
            {message}
          </div>
        )}

        {/* OVERVIEW */}

        {tab === "overview" && (
          <section className="mt-8">

            <h2 className="text-3xl font-black text-blue-950">
              Dashboard Overview
            </h2>

            <div className="mt-8 grid gap-5 md:grid-cols-3">

              <Stat
                label="Investors"
                value={investors.length}
              />

              <Stat
                label="Projects"
                value={projects.length}
              />

              <Stat
                label="Market Items"
                value={tickers.length}
              />

            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">

              <h3 className="text-xl font-black text-blue-950">
                NIRVIK Administration
              </h3>

              <p className="mt-3 max-w-2xl leading-8 text-slate-600">
                এখান থেকে investor, project, market এবং
                website content পরিচালনা করা যাবে।
              </p>

            </div>

          </section>
        )}

        {/* INVESTORS */}

        {tab === "investors" && (
          <section className="mt-8 space-y-8">

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <h2 className="text-2xl font-black text-blue-950">
                Add Investor
              </h2>

              <form
                onSubmit={addInvestor}
                className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
              >

                <Input
                  label="Serial"
                  value={
                    investorForm.serial_number
                  }
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      serial_number: v,
                    })
                  }
                />

                <Input
                  label="Name"
                  value={investorForm.name}
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      name: v,
                    })
                  }
                />

                <Input
                  label="NID"
                  value={investorForm.nid}
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      nid: v,
                    })
                  }
                />

                <Input
                  label="Username"
                  value={
                    investorForm.username
                  }
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      username: v,
                    })
                  }
                />

                <Input
                  label="Email"
                  value={investorForm.email}
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      email: v,
                    })
                  }
                />

                <PasswordInput
                  label="Password"
                  value={
                    investorForm.password
                  }
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      password: v,
                    })
                  }
                />

                <Input
                  label="Phone"
                  value={investorForm.phone}
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      phone: v,
                    })
                  }
                />

                <Input
                  label="Address"
                  value={investorForm.address}
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      address: v,
                    })
                  }
                />

                <Input
                  label="Total Investment"
                  value={
                    investorForm.total_investment
                  }
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      total_investment: v,
                    })
                  }
                />

                <Input
                  label="Total Amount Receivable"
                  value={
                    investorForm.total_return
                  }
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      total_return: v,
                    })
                  }
                />

                <Input
                  label="Total Amount Returned"
                  value={
                    investorForm.total_returned
                  }
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      total_returned: v,
                    })
                  }
                />

                <Input
                  label="Outstanding Amount"
                  value={
                    investorForm.due_amount
                  }
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      due_amount: v,
                    })
                  }
                />

                <Input
                  label="Total Profit"
                  value={investorForm.profit}
                  onChange={(v) =>
                    setInvestorForm({
                      ...investorForm,
                      profit: v,
                    })
                  }
                />

                <div className="md:col-span-2 lg:col-span-4">

                  <button
                    type="submit"
                    className="rounded-xl bg-blue-950 px-7 py-3 font-bold text-white hover:bg-purple-950"
                  >
                    Add Investor
                  </button>

                </div>

              </form>

            </div>

            {editingInvestorId && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-7 shadow-sm">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-900">
                      Investor Management
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-blue-950">
                      Edit Investor
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={cancelEditInvestor}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel Edit
                  </button>
                </div>

                <form
                  onSubmit={updateInvestor}
                  className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                >
                  <Input label="Serial" value={investorForm.serial_number} onChange={(v) => setInvestorForm({ ...investorForm, serial_number: v })} />
                  <Input label="Name" value={investorForm.name} onChange={(v) => setInvestorForm({ ...investorForm, name: v })} />
                  <Input label="NID" value={investorForm.nid} onChange={(v) => setInvestorForm({ ...investorForm, nid: v })} />
                  <Input label="Username" value={investorForm.username} onChange={(v) => setInvestorForm({ ...investorForm, username: v })} />
                  <Input label="Email" value={investorForm.email} onChange={(v) => setInvestorForm({ ...investorForm, email: v })} />
                  <Input label="Phone" value={investorForm.phone} onChange={(v) => setInvestorForm({ ...investorForm, phone: v })} />
                  <Input label="Address" value={investorForm.address} onChange={(v) => setInvestorForm({ ...investorForm, address: v })} />
                  <Input label="Total Investment" value={investorForm.total_investment} onChange={(v) => setInvestorForm({ ...investorForm, total_investment: v })} />
                  <Input label="Total Amount Receivable" value={investorForm.total_return} onChange={(v) => setInvestorForm({ ...investorForm, total_return: v })} />
                  <Input label="Total Amount Returned" value={investorForm.total_returned} onChange={(v) => setInvestorForm({ ...investorForm, total_returned: v })} />
                  <Input label="Outstanding Amount" value={investorForm.due_amount} onChange={(v) => setInvestorForm({ ...investorForm, due_amount: v })} />
                  <Input label="Total Profit" value={investorForm.profit} onChange={(v) => setInvestorForm({ ...investorForm, profit: v })} />

                  <div className="flex items-end md:col-span-2 lg:col-span-4">
                    <button
                      type="submit"
                      className="rounded-xl bg-blue-950 px-7 py-3 font-bold text-white hover:bg-purple-950"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {selectedInvestor && (
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-900">
                      Investor Panel
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-blue-950">
                      {selectedInvestor.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvestor(null)}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Serial", selectedInvestor.serial_number],
                    ["NID", selectedInvestor.nid || "—"],
                    ["Email", selectedInvestor.email || "—"],
                    ["Username", selectedInvestor.username || "—"],
                    ["Phone", selectedInvestor.phone || "—"],
                    ["Address", selectedInvestor.address || "—"],
                    ["Total Investment", `৳${Number(selectedInvestor.total_investment).toLocaleString()}`],
                    ["Total Amount Receivable", `৳${Number(selectedInvestor.total_return).toLocaleString()}`],
                    ["Total Amount Returned", `৳${Number(selectedInvestor.total_returned).toLocaleString()}`],
                    ["Outstanding Amount", `৳${Number(selectedInvestor.due_amount).toLocaleString()}`],
                    ["Total Profit", `৳${Number(selectedInvestor.profit).toLocaleString()}`],
                    ["Status", selectedInvestor.is_active ? "Active" : "Inactive"],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-2 break-words font-bold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="p-6">

                <h2 className="text-2xl font-black text-blue-950">
                  Investor List
                </h2>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1100px] text-left text-sm">

                  <thead className="bg-slate-50">

                    <tr>
                      <th className="px-5 py-4">
                        SL
                      </th>

                      <th className="px-5 py-4">
                        Name
                      </th>

                      <th className="px-5 py-4">
                        Username
                      </th>

                      <th className="px-5 py-4">
                        Total Investment
                      </th>

                      <th className="px-5 py-4">
                        Total Amount Receivable
                      </th>

                      <th className="px-5 py-4">
                        Outstanding Amount
                      </th>

                      <th className="px-5 py-4">
                        Total Profit
                      </th>

                      <th className="px-5 py-4">
                        Action
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {investors.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-10 text-center text-slate-500"
                        >
                          No investors found.
                        </td>
                      </tr>
                    ) : (
                      investors.map(
                        (investor) => (
                          <tr
                            key={investor.id}
                            className="border-t border-slate-200"
                          >

                            <td className="px-5 py-4">
                              {
                                investor.serial_number
                              }
                            </td>

                            <td className="px-5 py-4 font-bold">
                              {investor.name}
                            </td>

                            <td className="px-5 py-4">
                              {investor.username ||
                                "—"}
                            </td>

                            <td className="px-5 py-4">
                              ৳
                              {Number(
                                investor.total_investment
                              ).toLocaleString()}
                            </td>

                            <td className="px-5 py-4">
                              ৳
                              {Number(
                                investor.total_return
                              ).toLocaleString()}
                            </td>

                            <td className="px-5 py-4 text-red-600">
                              ৳
                              {Number(
                                investor.due_amount
                              ).toLocaleString()}
                            </td>

                            <td className="px-5 py-4 text-emerald-600">
                              ৳
                              {Number(
                                investor.profit
                              ).toLocaleString()}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => viewInvestor(investor)}
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() => startEditInvestor(investor)}
                                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-900 hover:bg-blue-100"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteInvestor(investor.id)}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-600 hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

        {/* PROJECTS */}

        {tab === "projects" && (
          <section className="mt-8 space-y-8">

            <div className="rounded-2xl border border-slate-200 bg-white p-7">

              <h2 className="text-2xl font-black text-blue-950">
                Add Project
              </h2>

              <form
                onSubmit={addProject}
                className="mt-6 grid gap-4 md:grid-cols-2"
              >

                <Input
                  label="Project Name"
                  value={projectForm.name}
                  onChange={(v) =>
                    setProjectForm({
                      ...projectForm,
                      name: v,
                    })
                  }
                />

                <Input
                  label="Location"
                  value={
                    projectForm.location
                  }
                  onChange={(v) =>
                    setProjectForm({
                      ...projectForm,
                      location: v,
                    })
                  }
                />

                <Input
                  label="Sector"
                  value={projectForm.sector}
                  onChange={(v) =>
                    setProjectForm({
                      ...projectForm,
                      sector: v,
                    })
                  }
                />

                <Input
                  label="Status"
                  value={projectForm.status}
                  onChange={(v) =>
                    setProjectForm({
                      ...projectForm,
                      status: v,
                    })
                  }
                />

                <Input
                  label="Image URL"
                  value={
                    projectForm.image_url
                  }
                  onChange={(v) =>
                    setProjectForm({
                      ...projectForm,
                      image_url: v,
                    })
                  }
                />

                <Input
                  label="Display Order"
                  value={
                    projectForm.display_order
                  }
                  onChange={(v) =>
                    setProjectForm({
                      ...projectForm,
                      display_order: v,
                    })
                  }
                />

                <div className="md:col-span-2">

                  <label className="text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={
                      projectForm.description
                    }
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        description:
                          e.target.value,
                      })
                    }
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                  />

                </div>

                <button
                  type="submit"
                  className="w-fit rounded-xl bg-blue-950 px-7 py-3 font-bold text-white hover:bg-purple-950"
                >
                  Add Project
                </button>

              </form>

            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {projects.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 md:col-span-2 lg:col-span-3">
                  No projects found.
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >

                    {project.image_url && (
                      <img
                        src={project.image_url}
                        alt={project.name}
                        className="mb-5 h-48 w-full rounded-xl object-cover"
                      />
                    )}

                    <p className="text-xs font-bold uppercase tracking-wider text-purple-900">
                      {project.status}
                    </p>

                    <h3 className="mt-2 text-xl font-black text-blue-950">
                      {project.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {project.location ||
                        "—"}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {project.sector || "—"}
                    </p>

                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {project.description ||
                        "No description."}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        deleteProject(
                          project.id
                        )
                      }
                      className="mt-5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>

                  </div>
                ))
              )}

            </div>

          </section>
        )}

        {/* MARKET LIVE */}

        {tab === "market" && (
          <section className="mt-8 space-y-8">

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-900">
                    Market Management
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-blue-950">
                    {editingTickerId
                      ? "Edit Market Item"
                      : "Add Market Item"}
                  </h2>

                </div>

                {editingTickerId && (
                  <button
                    type="button"
                    onClick={
                      cancelEditTicker
                    }
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel Edit
                  </button>
                )}

              </div>

              <form
                onSubmit={
                  editingTickerId
                    ? updateTicker
                    : addTicker
                }
                className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6"
              >

                <Input
                  label="Name"
                  value={tickerForm.name}
                  onChange={(v) =>
                    setTickerForm({
                      ...tickerForm,
                      name: v,
                    })
                  }
                />

                <Input
                  label="Symbol"
                  value={tickerForm.symbol}
                  onChange={(v) =>
                    setTickerForm({
                      ...tickerForm,
                      symbol: v,
                    })
                  }
                />

                <Input
                  label="Price"
                  value={tickerForm.price}
                  onChange={(v) =>
                    setTickerForm({
                      ...tickerForm,
                      price: v,
                    })
                  }
                />

                <Input
                  label="Change %"
                  value={
                    tickerForm.change_percent
                  }
                  onChange={(v) =>
                    setTickerForm({
                      ...tickerForm,
                      change_percent: v,
                    })
                  }
                />

                <Input
                  label="Display Order"
                  value={
                    tickerForm.display_order
                  }
                  onChange={(v) =>
                    setTickerForm({
                      ...tickerForm,
                      display_order: v,
                    })
                  }
                />

                <div>

                  <label className="text-sm font-semibold text-slate-700">
                    Direction
                  </label>

                  <select
                    value={
                      tickerForm.direction
                    }
                    onChange={(e) =>
                      setTickerForm({
                        ...tickerForm,
                        direction:
                          e.target.value as
                            | "up"
                            | "down",
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
                  >

                    <option value="up">
                      Up
                    </option>

                    <option value="down">
                      Down
                    </option>

                  </select>

                </div>

                <div className="md:col-span-2 lg:col-span-6">

                  <button
                    type="submit"
                    className="rounded-xl bg-blue-950 px-7 py-3 font-bold text-white hover:bg-purple-950"
                  >
                    {editingTickerId
                      ? "Save Market Changes"
                      : "Add Market Item"}
                  </button>

                </div>

              </form>

            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 p-6">

                <h2 className="text-2xl font-black text-blue-950">
                  Live Market Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  এখান থেকে public website-এর Market
                  Live information নিয়ন্ত্রণ করা যাবে।
                </p>

              </div>

              <div className="divide-y divide-slate-100">

                {tickers.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    কোনো Market Item এখনো যোগ করা হয়নি।
                  </div>
                ) : (
                  tickers.map((ticker) => (
                    <div
                      key={ticker.id}
                      className="p-5"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex items-center gap-4">

                          <div
                            className={
                              ticker.direction ===
                              "up"
                                ? "flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl font-black text-emerald-600"
                                : "flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl font-black text-red-600"
                            }
                          >
                            {ticker.direction ===
                            "up"
                              ? "↑"
                              : "↓"}
                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="font-black text-slate-900">
                                {ticker.name}
                              </p>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                {ticker.symbol}
                              </span>

                              {!ticker.is_active && (
                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                  Hidden
                                </span>
                              )}

                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Display order:{" "}
                              {
                                ticker.display_order
                              }
                            </p>

                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">

                            <p className="text-xs font-semibold text-slate-400">
                              Price
                            </p>

                            <p className="mt-1 font-black text-slate-900">
                              {Number(
                                ticker.price
                              ).toLocaleString()}
                            </p>

                          </div>

                          <div
                            className={
                              ticker.direction ===
                              "up"
                                ? "rounded-xl bg-emerald-50 px-4 py-3 text-center"
                                : "rounded-xl bg-red-50 px-4 py-3 text-center"
                            }
                          >

                            <p className="text-xs font-semibold text-slate-400">
                              Change
                            </p>

                            <p
                              className={
                                ticker.direction ===
                                "up"
                                  ? "mt-1 font-black text-emerald-600"
                                  : "mt-1 font-black text-red-600"
                              }
                            >
                              {ticker.direction ===
                              "up"
                                ? "+"
                                : "-"}
                              {Math.abs(
                                Number(
                                  ticker.change_percent
                                )
                              )}
                              %
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              startEditTicker(
                                ticker
                              )
                            }
                            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleTicker(
                                ticker
                              )
                            }
                            className={
                              ticker.is_active
                                ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100"
                                : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                            }
                          >
                            {ticker.is_active
                              ? "Hide"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteTicker(
                                ticker.id
                              )
                            }
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>
                  ))
                )}

              </div>

            </div>

          </section>
        )}

        {/* WEBSITE */}

        {tab === "website" && (
          <section className="mt-8">

            <div className="rounded-2xl border border-slate-200 bg-white p-7">

              <h2 className="text-2xl font-black text-blue-950">
                Website Content
              </h2>

              <form
                onSubmit={saveWebsite}
                className="mt-6 space-y-5"
              >

                <div className="grid gap-5 md:grid-cols-2">

                  <Input
                    label="Site Name"
                    value={
                      siteForm.site_name
                    }
                    onChange={(v) =>
                      setSiteForm({
                        ...siteForm,
                        site_name: v,
                      })
                    }
                  />

                  <Input
                    label="Tagline"
                    value={
                      siteForm.tagline
                    }
                    onChange={(v) =>
                      setSiteForm({
                        ...siteForm,
                        tagline: v,
                      })
                    }
                  />

                </div>

                <TextArea
                  label="About Us"
                  value={
                    siteForm.about_text
                  }
                  onChange={(v) =>
                    setSiteForm({
                      ...siteForm,
                      about_text: v,
                    })
                  }
                />

                <TextArea
                  label="Mission"
                  value={
                    siteForm.mission_text
                  }
                  onChange={(v) =>
                    setSiteForm({
                      ...siteForm,
                      mission_text: v,
                    })
                  }
                />

                <TextArea
                  label="Vision"
                  value={
                    siteForm.vision_text
                  }
                  onChange={(v) =>
                    setSiteForm({
                      ...siteForm,
                      vision_text: v,
                    })
                  }
                />

                <div className="grid gap-5 md:grid-cols-3">

                  <Input
                    label="Location"
                    value={
                      siteForm.location
                    }
                    onChange={(v) =>
                      setSiteForm({
                        ...siteForm,
                        location: v,
                      })
                    }
                  />

                  <Input
                    label="Phone"
                    value={
                      siteForm.phone
                    }
                    onChange={(v) =>
                      setSiteForm({
                        ...siteForm,
                        phone: v,
                      })
                    }
                  />

                  <Input
                    label="Email"
                    value={
                      siteForm.email
                    }
                    onChange={(v) =>
                      setSiteForm({
                        ...siteForm,
                        email: v,
                      })
                    }
                  />

                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-950 px-7 py-3 font-bold text-white hover:bg-purple-950"
                >
                  Save Website Content
                </button>

              </form>

            </div>

          </section>
        )}

        {/* INVESTMENT HISTORY */}

        {tab === "investment-history" && (
          <section className="mt-8">
            <InvestmentHistoryManager />
          </section>
        )}

        {/* ADMIN ACCOUNT */}

        {tab === "account" && (
          <section className="mt-8 space-y-8">

            {/* CURRENT ADMIN */}

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-900">
                Security
              </p>

              <h2 className="mt-1 text-2xl font-black text-blue-950">
                Admin Account
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                এখান থেকে administrator login email এবং
                password পরিবর্তন করা যাবে।
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Admin Email
                </p>

                <p className="mt-2 break-all text-lg font-black text-blue-950">
                  {currentEmail ||
                    "Loading..."}
                </p>

              </div>

            </div>

            {/* CHANGE EMAIL */}

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <h3 className="text-xl font-black text-blue-950">
                Change Admin Gmail
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                নিরাপত্তার জন্য বর্তমান password দিতে হবে।
                Email change করার পরে Supabase-এর email
                confirmation সম্পন্ন করতে হবে।
              </p>

              <form
                onSubmit={changeAdminEmail}
                className="mt-6 max-w-2xl space-y-5"
              >

                <Input
                  label="New Admin Gmail"
                  value={
                    emailForm.newEmail
                  }
                  onChange={(v) =>
                    setEmailForm({
                      ...emailForm,
                      newEmail: v,
                    })
                  }
                />

                <PasswordInput
                  label="Current Password"
                  value={
                    emailForm.currentPassword
                  }
                  onChange={(v) =>
                    setEmailForm({
                      ...emailForm,
                      currentPassword: v,
                    })
                  }
                />

                <button
                  type="submit"
                  disabled={accountLoading}
                  className="rounded-xl bg-blue-950 px-7 py-3 font-bold text-white hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {accountLoading
                    ? "Updating..."
                    : "Change Admin Gmail"}
                </button>

              </form>

            </div>

            {/* CHANGE PASSWORD */}

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <h3 className="text-xl font-black text-blue-950">
                Change Admin Password
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                Password পরিবর্তনের আগে বর্তমান password
                verify করা হবে।
              </p>

              <form
                onSubmit={changeAdminPassword}
                className="mt-6 max-w-2xl space-y-5"
              >

                <PasswordInput
                  label="Current Password"
                  value={
                    passwordForm.currentPassword
                  }
                  onChange={(v) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: v,
                    })
                  }
                />

                <PasswordInput
                  label="New Password"
                  value={
                    passwordForm.newPassword
                  }
                  onChange={(v) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: v,
                    })
                  }
                />

                <PasswordInput
                  label="Confirm New Password"
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={(v) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: v,
                    })
                  }
                />

                {passwordOtpStep && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <label className="block text-sm font-bold text-blue-950">
                      Gmail Verification Code
                    </label>
                    <input
                      value={passwordOtp}
                      onChange={(e) =>
                        setPasswordOtp(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="6-digit code"
                      className="mt-2 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-center text-xl tracking-[0.4em] outline-none focus:border-blue-950"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={accountLoading}
                    className="rounded-xl bg-blue-950 px-7 py-3 font-bold text-white hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {accountLoading
                      ? "Processing..."
                      : passwordOtpStep
                        ? "Verify Code & Change Password"
                        : "Send Gmail Verification Code"}
                  </button>

                  {passwordOtpStep && (
                    <button
                      type="button"
                      disabled={accountLoading}
                      onClick={() => {
                        setPasswordOtp("");
                        setPasswordOtpStep(false);
                        setMessage("");
                      }}
                      className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Start Over
                    </button>
                  )}
                </div>

              </form>

            </div>

            {/* SECURITY NOTICE */}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">

              <h3 className="font-black text-amber-900">
                Security Notice
              </h3>

              <p className="mt-2 text-sm leading-7 text-amber-800">
                Current password browser-এ save করা হয় না।
                Verification সরাসরি Supabase Authentication-এর
                মাধ্যমে করা হয়।
              </p>

              <p className="mt-2 text-sm leading-7 text-amber-800">
                পরবর্তী ধাপে চাইলে Admin Login এবং sensitive
                account changes-এর জন্য email OTP / reauthentication
                security যোগ করা যাবে।
              </p>

            </div>

          </section>
        )}

      </div>
    </main>
  );
}

/* =========================
   INPUT COMPONENT
========================= */

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
      />
    </div>
  );
}

/* =========================
   PASSWORD INPUT
========================= */

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="password"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        autoComplete="new-password"
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
      />
    </div>
  );
}

/* =========================
   TEXTAREA COMPONENT
========================= */

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        rows={6}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-950"
      />
    </div>
  );
}

/* =========================
   STAT COMPONENT
========================= */

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-black text-blue-950">
        {value}
      </p>

    </div>
  );
}