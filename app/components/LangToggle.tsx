"use client";

import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 flex flex-col gap-1 z-50">
      <div className="flex gap-1">
        <button
          onClick={() => setLang("fr")}
          className={`text-2xl leading-none p-1 rounded-lg transition ${lang === "fr" ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
        >
          🇫🇷
        </button>
        <button
          onClick={() => setLang("en")}
          className={`text-2xl leading-none p-1 rounded-lg transition ${lang === "en" ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
        >
          🇬🇧
        </button>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setTheme("light")}
          className={`text-2xl leading-none p-1 rounded-lg transition ${theme === "light" ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
        >
          ☀️
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`text-2xl leading-none p-1 rounded-lg transition ${theme === "dark" ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
        >
          🌙
        </button>
      </div>
    </div>
  );
}
