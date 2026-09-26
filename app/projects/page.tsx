import Image from "next/image";
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";

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

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [
    { data: projectsData, error: projectsError },
    { data: settingsData },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, location, sector, description, status, image_url, display_order, is_active"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false }),

    supabase
      .from("site_settings")
      .select("site_name, location, phone, email")
      .limit(1)
      .maybeSingle(),
  ]);

  if (projectsError) {
    console.error("Projects page error:", projectsError.message);
  }

  const projects = (projectsData || []) as Project[];
  const settings = (settingsData || {}) as SiteSettings;

  const siteName = settings.site_name || "NIRVIK";
  const location = settings.location || "Bangladesh";
  const phone = settings.phone || "";
  const email = settings.email || "";

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
              href="/projects"
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

      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-purple-950 px-6 py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl text-center">
          <p className="font-semibold uppercase tracking-[0.3em] text-blue-200">
            NIRVIK Investment Portfolio
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Our Projects
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-blue-100 md:text-lg">
            Explore the investment projects and sectors where NIRVIK
            operates. Select a project to view its location, sector,
            description and current status.
          </p>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-semibold uppercase tracking-[0.2em] text-purple-800">
                Investment Opportunities
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">
                Active Projects
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {projects.length} active{" "}
              {projects.length === 1 ? "project" : "projects"}
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <div className="text-6xl">📊</div>

              <h3 className="mt-5 text-2xl font-bold text-slate-900">
                No projects available
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                NIRVIK project information will appear here once
                projects are added from the Admin Panel.
              </p>

              <Link
                href="/"
                className="mt-7 inline-block rounded-xl bg-blue-950 px-6 py-3 font-bold text-white transition hover:bg-purple-950"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const icon = projectIcon(project.sector);

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* IMAGE */}
                    {project.image_url ? (
                      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                        <Image
                          src={project.image_url}
                          alt={project.name}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                        <span className="text-7xl transition duration-300 group-hover:scale-110">
                          {icon}
                        </span>
                      </div>
                    )}

                    {/* CONTENT */}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-800">
                            NIRVIK Project
                          </p>

                          <h3 className="mt-2 text-2xl font-black text-slate-950 transition group-hover:text-blue-950">
                            {project.name}
                          </h3>
                        </div>

                        {project.status && (
                          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold capitalize text-blue-800">
                            {project.status}
                          </span>
                        )}
                      </div>

                      {project.sector && (
                        <p className="mt-4 font-semibold text-blue-950">
                          {project.sector}
                        </p>
                      )}

                      {project.location && (
                        <p className="mt-3 text-sm text-slate-500">
                          📍 {project.location}
                        </p>
                      )}

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                        {project.description ||
                          "Project information is managed by NIRVIK."}
                      </p>

                      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                        <span className="font-bold text-blue-950">
                          View Project
                        </span>

                        <span className="text-xl transition group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-50 p-10 text-center md:p-14">
          <p className="font-semibold uppercase tracking-[0.25em] text-purple-800">
            Investor Portal
          </p>

          <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">
            Manage your investment portfolio
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Login to your NIRVIK investor account to view your
            investments, returns, profit and outstanding amounts.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl bg-blue-950 px-8 py-4 font-bold text-white transition hover:bg-purple-950"
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
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>

                <Link
                  href="/#about"
                  className="transition hover:text-white"
                >
                  About Us
                </Link>

                <Link
                  href="/projects"
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