"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("mymun545@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loginEmail = email.trim().toLowerCase();

      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

      if (authError || !data.user || !data.session) {
        setError("Invalid admin email or password.");
        return;
      }

      const { data: role, error: roleError } =
        await supabase.rpc("get_my_role");

      if (roleError || role !== "admin") {
        await supabase.auth.signOut({
          scope: "local",
        });

        setError("Admin access required.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

        <div className="text-center">
          <Image
            src="/logo.png"
            alt="NIRVIK"
            width={180}
            height={100}
            loading="eager"
            className="mx-auto h-auto w-[160px]"
          />

          <h1 className="mt-6 text-2xl font-black text-blue-950">
            Admin Panel
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Sign in with your admin email and password.
          </p>
        </div>

        <form
          onSubmit={login}
          className="mt-8 space-y-5"
        >
          <input
            type="email"
            placeholder="Admin email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black placeholder:text-black outline-none focus:border-blue-950"
          />

          <input
            type="password"
            placeholder="Admin password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black placeholder:text-black outline-none focus:border-blue-950"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-950 py-4 font-bold text-white hover:bg-purple-950 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

      </div>
    </main>
  );
}