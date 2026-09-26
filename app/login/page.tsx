"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loginEmail = email.trim().toLowerCase();

      // Login
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

      if (loginError || !data.user || !data.session) {
        setError("Invalid email or password");
        return;
      }

      // Get account role
      const { data: role, error: roleError } =
        await supabase.rpc("get_my_role");

      if (roleError) {
        console.error("Role check error:", roleError);

        await supabase.auth.signOut({
          scope: "local",
        });

        setError("Could not verify your account.");
        return;
      }

      // ADMIN → Admin Panel
      if (role === "admin") {
        router.replace("/admin");
        router.refresh();
        return;
      }

      // INVESTOR → Investor Dashboard
      if (role === "investor") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      // Invalid / unknown role
      await supabase.auth.signOut({
        scope: "local",
      });

      setError("This account does not have a valid access role.");
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="mb-8 text-center">

          <Image
            src="/logo.png"
            alt="NIRVIK"
            width={220}
            height={120}
            className="mx-auto h-auto w-[220px]"
            priority
          />

          <h1 className="mt-6 text-3xl font-bold">
            Login
          </h1>

          <p className="mt-2 text-slate-400">
            Access your NIRVIK account
          </p>

        </div>

        {/* LOGIN FORM */}
        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl"
        >

          {/* EMAIL */}
          <label
            htmlFor="email"
            className="text-sm font-semibold"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
            disabled={loading}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* PASSWORD */}
          <label
            htmlFor="password"
            className="mt-6 block text-sm font-semibold"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            disabled={loading}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* ERROR */}
          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-lg bg-emerald-500 py-3 font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* FOOTER */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Your investment information is securely managed by NIRVIK.
        </p>

      </div>
    </main>
  );
}