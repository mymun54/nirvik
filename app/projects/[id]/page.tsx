import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

type Project = {
  id: string;
  name: string;
  location: string | null;
  sector: string | null;
  description: string | null;
  status: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
};

type SiteSettings = {
  site_name: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
};

function projectIcon(sector: string | null) {
  const value = (sector || "").toLowerCase();

  if (value.includes("real") || value.includes("property")) {
    return "🏢";
  }

  if (value.includes("business") || value.includes("enterprise")) {
    return "💼";
  }

  if (
    value.includes("infrastructure") ||
    value.includes("development")
  ) {
    return "🌐";
  }

  if (value.includes("technology") || value.includes("tech")) {
    return "💻";
  }

  if (value.includes("energy") || value.includes("power")) {
    return "⚡";
  }

  return "📊";
}

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const [{ data: projectData, error: projectError }, { data: settingsData }] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          "id, name, location, sector, description, status, image_url, display_order, is_active"
        )
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle(),

      supabase
        .from("site_settings")
        .select("site_name, location, phone, email")
        .limit(1)
        .maybeSingle(),
    ]);

  if (projectError) {
    console.error("Project details error:", projectError.message);
    notFound();
  }

  if (!projectData) {
    notFound();
  }

  const project = projectData as Project;

  const settings = (settingsData || {}) as SiteSettings;

  const siteName = settings.site_name || "NIRVIK";
  const location = settings.location || "Bangladesh";
  const phone = settings.phone || "";
  const email = settings.email || "";

  const icon = projectIcon(project.sector);

  return (
    <main className="min-h-screen bg-white text-black">
      {/* TOP CONTACT BAR */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-3 text-sm text-slate-600 md:justify-end">
          <span>
            📍 <strong>Location:</strong> {location}
          </span>

          {phone && (
            <a
              href={`tel:${phone}`}
              className="transition hover:text-blue-950"
            >
              📞 <strong>Make A Call:</strong> {phone}
            </a>
          )}

          {email && (
            <a
              href={`mailto:${email}`}
              className="transition hover:text-blue-950"
            >
              ✉️ <strong>Drop Us A Line:</strong> {email}
            </a>
          )}
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt={siteName}
              width={150}
              height={70}
              className="h-auto w-[135px] md:w-[150px]"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/"
              className="font-semibold text-slate-700 transition hover:text-blue-950"
            >
              Home
            </Link>

            <Link
              href="/#about"
              className="font-semibold text-slate-700 transition hover:text-blue-950"
            >
              About Us
            </Link>

            <Link
              href="/#projects"
              className="font-semibold text-blue-950"
            >
              Projects
            </Link>

            <Link
              href="/login"
              className="rounded-xl bg-blue-950 px-5 py-3 font-bold text-white transition hover:bg-purple-950"
            >
              Login
            </Link>
          </nav>

          <Link
            href="/login"
            className="rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-950 md:hidden"
          >
            Login
          </Link>
        </div>
      </header>

      {/* PROJECT HERO */}
      <section className="bg-slate-50 px-6 py-12 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* IMAGE */}
            {project.image_url ? (
              <div className="relative h-[260px] w-full overflow-hidden bg-slate-100 md:h-[480px]">
                <Image
                  src={project.image_url}
                  alt={project.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            ) : (
              <div className="flex h-[260px] items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 md:h-[480px]">
                <span className="text-8xl">{icon}</span>
              </div>
            )}

            {/* PROJECT INFORMATION */}
            <div className="p-7 md:p-12">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold uppercase tracking-[0.25em] text-purple-800">
                    NIRVIK Project
                  </p>

                  <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                    {project.name}
                  </h1>

                  {project.sector && (
                    <p className="mt-4 text-lg font-semibold text-blue-950">
                      {project.sector}
                    </p>
                  )}
                </div>

                {project.status && (
                  <span className="w-fit rounded-full bg-blue-50 px-5 py-2.5 text-sm font-bold capitalize text-blue-800">
                    {project.status}
                  </span>
                )}
              </div>

              {/* LOCATION */}
              {project.location && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Project Location
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    📍 {project.location}
                  </p>
                </div>
              )}

              {/* DESCRIPTION */}
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-blue-950 md:text-3xl">
                  About This Project
                </h2>

                <div className="mt-4 max-w-4xl">
                  <p className="whitespace-pre-line text-lg leading-8 text-slate-600">
                    {project.description ||
                      "Project information is managed by NIRVIK."}
                  </p>
                </div>
              </div>

              {/* PROJECT DETAILS */}
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {project.sector && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Investment Sector
                    </p>

                    <p className="mt-2 font-bold text-slate-900">
                      {project.sector}
                    </p>
                  </div>
                )}

                {project.location && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Location
                    </p>

                    <p className="mt-2 font-bold text-slate-900">
                      {project.location}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-blue-950 to-purple-950 p-10 text-center text-white md:p-16">
          <p className="font-semibold uppercase tracking-[0.25em] text-blue-200">
            Investor Portal
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Access your investment portfolio
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
            Login to your NIRVIK investor account to view your
            portfolio, investment history, returns and profit.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-bold text-blue-950 transition hover:bg-slate-100"
          >
            Login
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Image
                src="/logo.png"
                alt={siteName}
                width={130}
                height={60}
                className="h-auto w-[130px]"
              />

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                NIRVIK provides structured investment opportunities and
                transparent portfolio access for investors.
              </p>
            </div>

            <div>
              <h3 className="font-bold">Quick Links</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link
                  href="/"
                  className="transition hover:text-white"
                >
                  Home
                </Link>

                <Link
                  href="/#about"
                  className="transition hover:text-white"
                >
                  About Us
                </Link>

                <Link
                  href="/#projects"
                  className="transition hover:text-white"
                >
                  Projects
                </Link>

                <Link
                  href="/login"
                  className="transition hover:text-white"
                >
                  Login
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold">Contact</h3>

              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <p>📍 {location}</p>

                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="block transition hover:text-white"
                  >
                    📞 {phone}
                  </a>
                )}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="block break-all transition hover:text-white"
                  >
                    ✉️ {email}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
            © 2026 NIRVIK. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}