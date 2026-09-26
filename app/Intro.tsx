"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Intro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">

        <div className="animate-pulse">
          <Image
            src="/logo.png"
            alt="NIRVIK"
            width={350}
            height={200}
            className="h-auto w-[280px] md:w-[350px]"
            priority
          />
        </div>

        <p className="mt-6 text-center text-sm font-semibold tracking-[0.3em] text-emerald-600">
          SMART INVESTMENT • STRONG FUTURE
        </p>

      </div>
    </div>
  );
}