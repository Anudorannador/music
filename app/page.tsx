"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AppearanceSetting = "light" | "dark" | "device";

const APPEARANCE_STORAGE_KEY = "appearance-setting";

const APPEARANCE_OPTIONS: Array<{ value: AppearanceSetting; label: string }> = [
  { value: "device", label: "Device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceSetting>("device");
  const [systemTheme, setSystemTheme] = useState<Exclude<AppearanceSetting, "device">>("light");

  // Load appearance from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "device") {
      setAppearance(stored);
    }

    const matches = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setSystemTheme(matches ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (event?: MediaQueryListEvent) => {
      const matches = typeof event?.matches === "boolean" ? event.matches : media.matches;
      setSystemTheme(matches ? "dark" : "light");
    };

    updateSystemTheme();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateSystemTheme);
      return () => {
        media.removeEventListener("change", updateSystemTheme);
      };
    }

    media.addListener(updateSystemTheme);
    return () => {
      media.removeListener(updateSystemTheme);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
    } catch {
      // Intentionally ignore write errors (e.g. private mode)
    }
  }, [appearance]);

  const resolvedTheme = appearance === "device" ? systemTheme : appearance;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;

    if (appearance === "device") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", appearance);
    }

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [appearance, resolvedTheme]);

  return (
    <div className="flex items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-12 items-center max-w-3xl w-full">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4 text-foreground">
            Music Theory Tools
          </h1>
          <p className={`text-lg sm:text-xl ${resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'}`}>
            Explore sound, chords, scales, and rhythm patterns
          </p>
        </div>

        <nav className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <Link
              className="group rounded-3xl border border-black/[.08] dark:border-white/[.145] bg-black/[.02] dark:bg-white/[.03] p-8 transition-all hover:bg-black/[.05] dark:hover:bg-white/[.06] hover:border-foreground/20 hover:shadow-lg flex flex-col items-center gap-4 text-center"
              href="/sound"
            >
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground transition-transform group-hover:scale-110"
              >
                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Sound</h2>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'}`}>
                  Explore musical notes and frequencies
                </p>
              </div>
            </Link>

            <Link
              className="group rounded-3xl border border-black/[.08] dark:border-white/[.145] bg-black/[.02] dark:bg-white/[.03] p-8 transition-all hover:bg-black/[.05] dark:hover:bg-white/[.06] hover:border-foreground/20 hover:shadow-lg flex flex-col items-center gap-4 text-center"
              href="/chords"
            >
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground transition-transform group-hover:scale-110"
              >
                <path d="M8 17.5L2 15V3L8 5.5V17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 17.5L9 15V3L15 5.5V17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 17.5L16 15V3L22 5.5V17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Chords</h2>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'}`}>
                  Discover chord structures and progressions
                </p>
              </div>
            </Link>

            <Link
              className="group rounded-3xl border border-black/[.08] dark:border-white/[.145] bg-black/[.02] dark:bg-white/[.03] p-8 transition-all hover:bg-black/[.05] dark:hover:bg-white/[.06] hover:border-foreground/20 hover:shadow-lg flex flex-col items-center gap-4 text-center"
              href="/scales"
            >
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground transition-transform group-hover:scale-110"
              >
                <path d="M3 12h4l3-9 4 18 3-9h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Scales</h2>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'}`}>
                  Learn scales and modes in all keys
                </p>
              </div>
            </Link>

            <Link
              className="group rounded-3xl border border-black/[.08] dark:border-white/[.145] bg-black/[.02] dark:bg-white/[.03] p-8 transition-all hover:bg-black/[.05] dark:hover:bg-white/[.06] hover:border-foreground/20 hover:shadow-lg flex flex-col items-center gap-4 text-center"
              href="/keys"
            >
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground transition-transform group-hover:scale-110"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 3v4M12 17v4M21 12h-4M7 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Keys</h2>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'}`}>
                  Explore key signatures and circle of fifths
                </p>
              </div>
            </Link>

            <Link
              className="group rounded-3xl border border-black/[.08] dark:border-white/[.145] bg-black/[.02] dark:bg-white/[.03] p-8 transition-all hover:bg-black/[.05] dark:hover:bg-white/[.06] hover:border-foreground/20 hover:shadow-lg flex flex-col items-center gap-4 text-center"
              href="/progressions"
            >
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground transition-transform group-hover:scale-110"
              >
                <path d="M3 12h4l3 9 4-18 3 9h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12v5M16 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Progressions</h2>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'}`}>
                  Explore and build chord progressions
                </p>
              </div>
            </Link>

            <Link
              className="group rounded-3xl border border-black/[.08] dark:border-white/[.145] bg-black/[.02] dark:bg-white/[.03] p-8 transition-all hover:bg-black/[.05] dark:hover:bg-white/[.06] hover:border-foreground/20 hover:shadow-lg flex flex-col items-center gap-4 text-center"
              href="/rhythm"
            >
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground transition-transform group-hover:scale-110"
              >
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="6" cy="6" r="2" fill="currentColor"/>
                <circle cx="18" cy="6" r="2" fill="currentColor"/>
                <circle cx="6" cy="18" r="2" fill="currentColor"/>
                <circle cx="18" cy="18" r="2" fill="currentColor"/>
              </svg>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Rhythm</h2>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'}`}>
                  Learn and practice rhythm patterns
                </p>
              </div>
            </Link>
          </div>
        </nav>

        <section className="w-full max-w-xl rounded-3xl border border-black/[.08] dark:border-white/[.145] bg-black/[.02] dark:bg-white/[.03] p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Appearance</h2>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70'}`}>
              Choose how the app looks. Default follows your device setting.
            </p>
          </div>
          <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Appearance options">
            {APPEARANCE_OPTIONS.map((option) => {
              const isActive = mounted && appearance === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground ${
                    isActive
                      ? "border-transparent bg-foreground text-background shadow-sm"
                      : "border-black/[.08] dark:border-white/[.25] bg-black/[.02] dark:bg-white/[.06] hover:border-foreground/40 hover:bg-black/[.04] dark:hover:bg-white/[.1] dark:hover:border-white/[.35]"
                  }`}
                >
                  <input
                    type="radio"
                    name="appearance"
                    value={option.value}
                    checked={isActive}
                    onChange={() => setAppearance(option.value)}
                    className="sr-only"
                  />
                  <span>{option.label}</span>
                  {option.value === "device" && (
                    <span className={`text-xs font-normal ${
                      isActive 
                        ? (resolvedTheme === 'dark' ? 'text-white/70' : 'text-black/70')
                        : (resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70')
                    }`}>
                      Syncs to your OS preference
                    </span>
                  )}
                  {option.value === "light" && (
                    <span className={`text-xs font-normal ${
                      isActive 
                        ? 'opacity-70' 
                        : (resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70')
                    }`}>
                      Bright background with high contrast
                    </span>
                  )}
                  {option.value === "dark" && (
                    <span className={`text-xs font-normal ${
                      isActive 
                        ? 'opacity-70' 
                        : (resolvedTheme === 'dark' ? 'text-white/90' : 'text-black/70')
                    }`}>
                      Ideal for low-light environments
                    </span>
                  )}
                </label>
              );
            })}
          </fieldset>
        </section>
      </main>
    </div>
  );
}
