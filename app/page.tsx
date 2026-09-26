import Intro from "./Intro";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "../lib/supabase/server";

type MarketTicker = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change_percent: number;
  direction: "up" | "down";
  is_active: boolean;
  display_order: number;
};

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
  about_text: string | null;
  mission_text: string | null;
  vision_text: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
};

function getMarketIcon(name: string, symbol: string) {
  const value = `${name} ${symbol}`.toLowerCase();

  if (value.includes("gold") || value.includes("xau")) {
    return "🥇";
  }

  if (
    value.includes("oil") ||
    value.includes("crude") ||
    value.includes("wti")
  ) {
    return "🛢️";
  }

  if (value.includes("bitcoin") || value.includes("btc")) {
    return "₿";
  }

  if (value.includes("ethereum") || value.includes("eth")) {
    return "Ξ";
  }

  if (value.includes("nasdaq") || value.includes("ndx")) {
    return "💻";
  }

  if (value.includes("s&p") || value.includes("spx")) {
    return "📈";
  }

  if (value.includes("dow") || value.includes("dji")) {
    return "🏦";
  }

  if (value.includes("dax")) {
    return "🇩🇪";
  }

  if (value.includes("eur")) {
    return "💶";
  }

  if (value.includes("gbp")) {
    return "💷";
  }

  if (value.includes("jpy") || value.includes("japan")) {
    return "🇯🇵";
  }

  if (value.includes("cypher")) {
    return "🔷";
  }

  if (value.includes("volume")) {
    return "📊";
  }

  if (value.includes("absorption")) {
    return "🧲";
  }

  if (value.includes("structure")) {
    return "📐";
  }

  if (value.includes("fibonacci")) {
    return "🌀";
  }

  return "📊";
}

function formatPrice(price: number) {
  return Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

function formatChange(change: number) {
  return Math.abs(Number(change)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function MarketTicker({
  markets,
}: {
  markets: MarketTicker[];
}) {
  if (markets.length === 0) {
    return null;
  }

  const tickerItems = [...markets, ...markets];

  return (
    <div className="overflow-hidden border-b border-slate-200 bg-slate-950">
      <div className="flex w-max animate-ticker">
        {tickerItems.map((market, index) => {
          const icon = getMarketIcon(
            market.name,
            market.symbol
          );

          return (
            <div
              key={`${market.id}-${index}`}
              className="flex items-center gap-3 whitespace-nowrap border-r border-white/10 px-6 py-3 text-sm"
            >
              <span className="text-lg">
                {icon}
              </span>

              <div>
                <p className="font-semibold text-white">
                  {market.symbol}
                </p>

                <p className="text-[11px] text-slate-400">
                  {market.name}
                </p>
              </div>

              <span className="font-bold text-white">
                {formatPrice(market.price)}
              </span>

              <span
                className={
                  market.direction === "up"
                    ? "font-bold text-emerald-400"
                    : "font-bold text-red-400"
                }
              >
                {market.direction === "up"
                  ? "▲"
                  : "▼"}{" "}
                {formatChange(market.change_percent)}
                %
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function projectIcon(sector: string | null) {
  const value = (sector || "").toLowerCase();

  if (
    value.includes("real") ||
    value.includes("property")
  ) {
    return "🏢";
  }

  if (
    value.includes("business") ||
    value.includes("enterprise")
  ) {
    return "💼";
  }

  if (
    value.includes("infrastructure") ||
    value.includes("development")
  ) {
    return "🌐";
  }

  if (
    value.includes("technology") ||
    value.includes("tech")
  ) {
    return "💻";
  }

  if (
    value.includes("energy") ||
    value.includes("power")
  ) {
    return "⚡";
  }

  return "📊";
}

export default async function Home() {
  const supabase = await createClient();

  const [
    marketsResult,
    projectsResult,
    settingsResult,
    investorsResult,
  ] = await Promise.all([
    // ACTIVE MARKETS ONLY
    supabase
      .from("market_tickers")
      .select(
        "id, name, symbol, price, change_percent, direction, is_active, display_order"
      )
      .eq("is_active", true)
      .order("display_order", {
        ascending: true,
      }),

    // ACTIVE PROJECTS ONLY
    supabase
      .from("projects")
      .select(
        "id, name, location, sector, description, status, image_url, display_order, is_active"
      )
      .eq("is_active", true)
      .order("display_order", {
        ascending: true,
      }),

    // WEBSITE SETTINGS
    supabase
      .from("site_settings")
      .select(
        "about_text, mission_text, vision_text, location, phone, email"
      )
      .limit(1)
      .maybeSingle(),

    // ACTIVE INVESTOR COUNT
    supabase
      .from("investors")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_active", true),
  ]);

  if (marketsResult.error) {
    console.error(
      "Market ticker error:",
      marketsResult.error.message
    );
  }

  if (projectsResult.error) {
    console.error(
      "Projects error:",
      projectsResult.error.message
    );
  }

  if (settingsResult.error) {
    console.error(
      "Site settings error:",
      settingsResult.error.message
    );
  }

  if (investorsResult.error) {
    console.error(
      "Investors count error:",
      investorsResult.error.message
    );
  }

  const markets: MarketTicker[] = (
    marketsResult.data || []
  ).map((market) => ({
    ...market,
    price: Number(market.price),
    change_percent: Number(
      market.change_percent
    ),
  }));

  const projects: Project[] = (
    projectsResult.data || []
  ).map((project) => ({
    ...project,
    display_order: Number(
      project.display_order || 0
    ),
  }));

  const settings: SiteSettings =
    settingsResult.data || {
      about_text:
        "NIRVIK is a modern investment management platform designed to provide investors with organized, transparent and accessible investment information.",
      mission_text:
        "To create a structured and transparent environment where investors can access their investment information and portfolio data in an organized way.",
      vision_text:
        "To build a modern investment management platform focused on transparency, accessibility and long-term financial information management.",
      location: "Bangladesh",
      phone: null,
      email: null,
    };

  const investorCount = investorsResult.count || 0;
  const projectCount = projects.length;
  const marketCount = markets.length;

  return (
    <>
      <Intro />

      <main className="min-h-screen bg-white text-black">

        {/* =========================
            NAVBAR
        ========================= */}

        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

            <Link
              href="/"
              className="flex items-center"
            >
              <Image
                src="/logo.png"
                alt="NIRVIK"
                width={150}
                height={70}
                className="h-auto w-[150px]"
                priority
              />
            </Link>

            <div className="hidden items-center gap-8 md:flex">

              <a
                href="#home"
                className="font-medium text-slate-700 transition hover:text-blue-950"
              >
                Home
              </a>

              <a
                href="#about"
                className="font-medium text-slate-700 transition hover:text-blue-950"
              >
                About Us
              </a>

              <a
                href="#projects"
                className="font-medium text-slate-700 transition hover:text-blue-950"
              >
                Projects
              </a>

              <a
                href="#market-live"
                className="font-medium text-slate-700 transition hover:text-blue-950"
              >
                Market Live
              </a>

            </div>

            <Link
              href="/login"
              className="rounded-xl bg-blue-950 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-purple-950"
            >
              Login
            </Link>

          </div>
        </nav>

        {/* =========================
            CONTACT BAR
        ========================= */}

        <div className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-6 py-3 text-sm text-slate-700 md:justify-between">

            <div className="flex flex-wrap items-center justify-center gap-6">

              <span>
                📍 Location:{" "}
                {settings.location || "Bangladesh"}
              </span>

              {settings.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="transition hover:text-blue-950"
                >
                  📞 Make A Call: {settings.phone}
                </a>
              )}

              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="transition hover:text-blue-950"
                >
                  ✉️ Drop Us A Line: {settings.email}
                </a>
              )}

            </div>

            <div className="hidden text-xs font-semibold tracking-[0.2em] text-purple-800 md:block">
              SMART INVESTMENT • STRONG FUTURE
            </div>

          </div>
        </div>

        {/* =========================
            MARKET TICKER
        ========================= */}

        <MarketTicker markets={markets} />

        {/* =========================
            HERO
        ========================= */}

        <section
          id="home"
          className="relative overflow-hidden bg-white px-6 py-24 md:py-32"
        >

          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-200/40 blur-3xl" />

          <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-blue-100/60 blur-3xl" />

          <div className="relative mx-auto max-w-7xl">

            <div className="max-w-4xl">

              <p className="mb-6 font-semibold uppercase tracking-[0.3em] text-purple-800">
                Smart Investment • Strong Future
              </p>

              <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-7xl">
                Grow Your Wealth.
                <br />
                <span className="text-blue-950">
                  Secure Your Future.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                NIRVIK is a modern investment management
                platform designed to provide investors with
                organized, transparent and accessible
                investment information.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">

                <a
                  href="#projects"
                  className="rounded-xl bg-blue-950 px-7 py-4 font-semibold text-white shadow-xl shadow-blue-950/10 transition hover:bg-purple-950"
                >
                  Explore Projects
                </a>

                <a
                  href="#about"
                  className="rounded-xl border border-slate-300 bg-white px-7 py-4 font-semibold text-slate-900 transition hover:border-purple-300 hover:bg-purple-50"
                >
                  About NIRVIK
                </a>

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            STATS
        ========================= */}

        <section className="border-y border-slate-200 bg-slate-50">

          <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">

            <div className="border-r border-slate-200 p-8 text-center md:p-10">
              <h2 className="text-3xl font-black text-blue-950">
                {investorCount}+
              </h2>

              <p className="mt-2 text-slate-600">
                Investors
              </p>
            </div>

            <div className="border-r border-slate-200 p-8 text-center md:p-10">
              <h2 className="text-3xl font-black text-purple-900">
                {projectCount}+
              </h2>

              <p className="mt-2 text-slate-600">
                Projects
              </p>
            </div>

            <div className="border-r border-slate-200 p-8 text-center md:p-10">
              <h2 className="text-3xl font-black text-blue-950">
                {marketCount}
              </h2>

              <p className="mt-2 text-slate-600">
                Market Items
              </p>
            </div>

            <div className="p-8 text-center md:p-10">
              <h2 className="text-3xl font-black text-purple-900">
                24/7
              </h2>

              <p className="mt-2 text-slate-600">
                Portfolio Access
              </p>
            </div>

          </div>

        </section>

        {/* =========================
            ABOUT
        ========================= */}

        <section
          id="about"
          className="mx-auto max-w-7xl px-6 py-24 md:py-28"
        >

          <div className="grid gap-14 md:grid-cols-2 md:items-center">

            <div>

              <p className="font-semibold uppercase tracking-[0.25em] text-purple-800">
                About NIRVIK
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
                Investment management,
                <br />
                made clear.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                {settings.about_text}
              </p>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">

              <h3 className="text-2xl font-bold text-blue-950">
                Our Mission
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {settings.mission_text}
              </p>

              <div className="my-8 h-px bg-slate-200" />

              <h3 className="text-2xl font-bold text-purple-900">
                Our Vision
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {settings.vision_text}
              </p>

            </div>

          </div>

        </section>

        {/* =========================
            PROJECTS
        ========================= */}

        <section
          id="projects"
          className="bg-slate-50 px-6 py-24 md:py-28"
        >

          <div className="mx-auto max-w-7xl">

            <p className="font-semibold uppercase tracking-[0.25em] text-blue-950">
              Investment Areas
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-950">
              Explore Our Projects
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              Explore the sectors and projects where NIRVIK
              has investment interests or activities.
            </p>

            {projects.length === 0 ? (
              <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">

                <div className="text-4xl">
                  📊
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-950">
                  Projects Coming Soon
                </h3>

                <p className="mt-2 text-slate-500">
                  Investment projects will appear here once
                  they are published by the NIRVIK administration.
                </p>

              </div>
            ) : (
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {projects.map((project, index) => {

                  const icon = projectIcon(
                    project.sector
                  );

                  return (
                    <div
                      key={project.id}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl"
                    >

                      {project.image_url ? (
                        <div className="relative h-52 overflow-hidden bg-slate-100">

                          <Image
                            src={project.image_url}
                            alt={project.name}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />

                        </div>
                      ) : (
                        <div
                          className={`flex h-52 items-center justify-center ${
                            index % 2 === 0
                              ? "bg-blue-50"
                              : "bg-purple-50"
                          }`}
                        >
                          <span className="text-6xl">
                            {icon}
                          </span>
                        </div>
                      )}

                      <div className="p-8">

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <h3 className="text-2xl font-bold text-slate-950">
                              {project.name}
                            </h3>

                            {project.sector && (
                              <p className="mt-1 text-sm font-semibold text-purple-800">
                                {project.sector}
                              </p>
                            )}

                          </div>

                          {project.status && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-800">
                              {project.status}
                            </span>
                          )}

                        </div>

                        {project.location && (
                          <p className="mt-4 text-sm text-slate-500">
                            📍 {project.location}
                          </p>
                        )}

                        <p className="mt-4 leading-7 text-slate-600">
                          {project.description ||
                            "Investment project information is managed by NIRVIK."}
                        </p>

                        <Link
                          href={`/projects/${project.id}`}
                          className="mt-6 inline-block font-semibold text-blue-950 transition hover:text-purple-900"
                        >
                          View Project →
                        </Link>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>

        </section>

        {/* =========================
            MARKET LIVE
        ========================= */}

        <section
          id="market-live"
          className="border-y border-slate-200 bg-white px-6 py-24"
        >

          <div className="mx-auto max-w-7xl">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

              <div>

                <p className="font-semibold uppercase tracking-[0.25em] text-purple-800">
                  Market Live
                </p>

                <h2 className="mt-3 text-4xl font-bold text-slate-950">
                  Global Markets
                </h2>

                <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                  Market information managed directly from
                  the NIRVIK administration panel.
                </p>

              </div>

              <div className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-950">
                ● Admin Managed
              </div>

            </div>

            {markets.length === 0 ? (
              <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">

                <p className="font-semibold text-slate-600">
                  No market data available right now.
                </p>

              </div>
            ) : (
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

                {markets.map((market) => {

                  const icon = getMarketIcon(
                    market.name,
                    market.symbol
                  );

                  return (
                    <div
                      key={market.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-purple-200 hover:bg-purple-50"
                    >

                      <div className="text-2xl">
                        {icon}
                      </div>

                      <h3 className="mt-4 font-bold text-slate-950">
                        {market.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {market.symbol}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-2">

                        <span className="text-lg font-bold text-blue-950">
                          {formatPrice(market.price)}
                        </span>

                        <span
                          className={
                            market.direction === "up"
                              ? "text-sm font-bold text-emerald-600"
                              : "text-sm font-bold text-red-600"
                          }
                        >
                          {market.direction === "up"
                            ? "▲"
                            : "▼"}{" "}
                          {formatChange(
                            market.change_percent
                          )}
                          %
                        </span>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

            {/* MARKET ANALYSIS */}

            <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-8">

              <p className="font-semibold uppercase tracking-[0.2em] text-blue-950">
                Market Analysis
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Technical market analysis tools and indicators
                managed through the NIRVIK administration panel.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">

                {markets
                  .filter((market) => {
                    const value =
                      `${market.name} ${market.symbol}`.toLowerCase();

                    return (
                      value.includes("cypher") ||
                      value.includes("volume") ||
                      value.includes("absorption") ||
                      value.includes("structure") ||
                      value.includes("fibonacci")
                    );
                  })
                  .map((market) => (
                    <span
                      key={market.id}
                      className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800"
                    >
                      {market.name}
                    </span>
                  ))}

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            LOGIN CTA
        ========================= */}

        <section className="px-6 py-24">

          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 to-purple-950 p-10 text-center text-white shadow-2xl md:p-16">

            <p className="font-semibold uppercase tracking-[0.25em] text-blue-200">
              Investor Portal
            </p>

            <h2 className="mt-4 text-4xl font-bold md:text-5xl">
              Your investment,
              <br />
              always within reach.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
              Login to your NIRVIK account to view your
              portfolio, investment history, profit and returns.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-bold text-blue-950 transition hover:bg-slate-100"
            >
              Login
            </Link>

          </div>

        </section>

        {/* =========================
            FOOTER
        ========================= */}

        <footer className="border-t border-slate-200 bg-slate-950 text-white">

          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">

            {/* BRAND */}

            <div>

              <Image
                src="/logo.png"
                alt="NIRVIK"
                width={150}
                height={70}
                className="h-auto w-[150px]"
              />

              <p className="mt-5 max-w-sm leading-7 text-slate-400">
                Smart investment management and organized
                portfolio information.
              </p>

            </div>

            {/* CONTACT */}

            <div>

              <h3 className="font-bold">
                Contact Information
              </h3>

              <div className="mt-4 space-y-3 text-slate-400">

                <p>
                  📍 Location:{" "}
                  {settings.location || "Bangladesh"}
                </p>

                {settings.phone && (
                  <p>
                    📞 Make A Call:{" "}
                    <a
                      href={`tel:${settings.phone}`}
                      className="hover:text-white"
                    >
                      {settings.phone}
                    </a>
                  </p>
                )}

                {settings.email && (
                  <p>
                    ✉️ Drop Us A Line:{" "}
                    <a
                      href={`mailto:${settings.email}`}
                      className="hover:text-white"
                    >
                      {settings.email}
                    </a>
                  </p>
                )}

              </div>

            </div>

            {/* QUICK LINKS */}

            <div>

              <h3 className="font-bold">
                Quick Links
              </h3>

              <div className="mt-4 space-y-3">

                <a
                  href="#home"
                  className="block text-slate-400 hover:text-white"
                >
                  Home
                </a>

                <a
                  href="#about"
                  className="block text-slate-400 hover:text-white"
                >
                  About Us
                </a>

                <a
                  href="#projects"
                  className="block text-slate-400 hover:text-white"
                >
                  Projects
                </a>

                <a
                  href="#market-live"
                  className="block text-slate-400 hover:text-white"
                >
                  Market Live
                </a>

                <Link
                  href="/login"
                  className="block text-slate-400 hover:text-white"
                >
                  Login
                </Link>

              </div>

            </div>

          </div>

          <div className="border-t border-white/10 py-5 text-center text-sm text-slate-500">
            © 2026 NIRVIK. All rights reserved.
          </div>

        </footer>

      </main>
    </>
  );
}