import type { Config } from "tailwindcss"
const defaultTheme = require("tailwindcss/defaultTheme")

export default {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Background tokens
        "bg-default": "var(--color-global-snow)",
        "bg-primary": "var(--color-global-blue-500)",
        "bg-primary-focus": "var(--color-global-blue-600)",
        "bg-primary-light": "var(--color-global-blue-50)",
        "bg-accent": "var(--color-global-slate-900)",
        "bg-lightest": "var(--color-global-white)",
        "bg-light": "var(--color-global-slate-100)",
        "bg-destructive-light": "var(--color-global-red-50)",
        "bg-destructive-strong": "var(--color-global-red-500)",
        "bg-destructive-focus": "var(--color-global-red-600)",
        "bg-warning-light": "var(--color-global-amber-50)",
        "bg-warning-strong": "var(--color-global-amber-500)",
        "bg-warning-focus": "var(--color-global-amber-600)",
        "bg-success-light": "var(--color-global-emerald-50)",
        "bg-success-strong": "var(--color-global-emerald-500)",
        "bg-success-focus": "var(--color-global-emerald-600)",
        "bg-disabled-light": "var(--color-global-neutral-150)",
        "bg-focus-lightest": "var(--color-global-blue-25)",
        "bg-focus-lighter": "var(--color-global-blue-100)",
        "bg-focus-strong": "var(--color-global-blue-500)",
        "bg-overlay": "var(--color-global-gray-alpha)",

        // Foreground tokens
        "text-default": "var(--color-global-slate-900)",
        "text-inverted": "var(--color-global-white)",
        "text-accent": "var(--color-global-blue-500)",
        "text-light": "var(--color-global-slate-700)",
        "text-lighter": "var(--color-global-slate-400)",
        "text-focus": "var(--color-global-blue-700)",
        "text-destructive-light": "var(--color-global-red-700)",
        "text-destructive-strong": "var(--color-global-red-900)",
        "text-warning-light": "var(--color-global-amber-700)",
        "text-warning-strong": "var(--color-global-amber-900)",
        "text-success-light": "var(--color-global-emerald-500)",
        "text-success-strong": "var(--color-global-emerald-900)",
        "text-disabled": "var(--color-global-slate-400)",

        // Border tokens
        "border-default": "var(--color-global-neutral-200)",
        "border-light": "var(--color-global-neutral-100)",
        "border-strong": "var(--color-global-neutral-300)",
        "border-focus": "var(--color-global-blue-500)",
        "border-destructive": "var(--color-global-red-500)",
        "border-warning": "var(--color-global-amber-500)",
        "border-success": "var(--color-global-emerald-500)",
        "border-disabled": "var(--color-global-neutral-200)",
        "border-default-border": "#CAD5E2",
        "border-destructive-border": "#FB2C36",

        // Avatar tokens
        "avatar-1": "var(--color-global-blue-400)",
        "avatar-2": "var(--color-global-slate-900)",
        "avatar-3": "var(--color-global-violet-500)",
        "avatar-4": "var(--color-global-emerald-500)",
        "avatar-5": "var(--color-global-amber-500)",

        // Tag tokens
        "tag-1": "var(--color-global-blue-100)",
        "tag-2": "var(--color-global-slate-100)",
        "tag-3": "var(--color-global-violet-100)",
        "tag-4": "var(--color-global-emerald-100)",
        "tag-5": "var(--color-global-amber-100)",

        // Global color values
        global: {
          snow: "#F9FAFB",
          white: "#FFFFFF",
          "gray-alpha": "rgba(0, 0, 0, 0.4)",
          blue: {
            "25": "#F5F8FF",
            "50": "#EFF6FF",
            "100": "#DBEAFE",
            "400": "#60A5FA",
            "500": "#3B82F6",
            "600": "#2563EB",
            "700": "#1D4ED8",
          },
          slate: {
            "100": "#F1F5F9",
            "400": "#94A3B8",
            "700": "#334155",
            "900": "#0F172A",
          },
          neutral: {
            "100": "#F5F5F5",
            "150": "#EDEDED",
            "200": "#E5E5E5",
            "300": "#D4D4D4",
          },
          red: {
            "50": "#FEF2F2",
            "500": "#EF4444",
            "600": "#DC2626",
            "700": "#B91C1C",
            "900": "#7F1D1D",
          },
          amber: {
            "50": "#FFFBEB",
            "500": "#F59E0B",
            "600": "#D97706",
            "700": "#B45309",
            "900": "#78350F",
          },
          emerald: {
            "50": "#ECFDF5",
            "500": "#10B981",
            "600": "#059669",
            "900": "#064E3B",
          },
          violet: {
            "100": "#EDE9FE",
            "500": "#8B5CF6",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "radius-01": "0.125rem", // 2px
        "radius-02": "0.25rem", // 4px
        "radius-03": "0.375rem", // 6px
        "radius-04": "0.5rem", // 8px
        "radius-05": "0.75rem", // 12px
        "radius-06": "1rem", // 16px
        "radius-round": "100rem", // 1600px
      },
      spacing: {
        "spacing-01": "0.125rem", // 2px
        "spacing-02": "0.25rem", // 4px
        "spacing-03": "0.5rem", // 8px
        "spacing-04": "0.75rem", // 12px
        "spacing-05": "1rem", // 16px
        "spacing-06": "1.5rem", // 24px
        "spacing-07": "2rem", // 32px
        "spacing-08": "2.5rem", // 40px
        "spacing-09": "3rem", // 48px
        "spacing-10": "4rem", // 64px
        "spacing-11": "5rem", // 80px
        "spacing-12": "6rem", // 96px
        "spacing-13": "10rem", // 160px
      },
      boxShadow: {
        "extra-small": "0px 1px 2px rgba(0, 0, 0, 0.02), 0px 2px 4px rgba(0, 0, 0, 0.02)",
        small: "0px 0.5px 1px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.08), 0px -1px 2px rgba(0, 0, 0, 0.04)",
        base: "0px 0.5px 1px rgba(0, 0, 0, 0.032), 0px 1.8px 3.8px rgba(0, 0, 0, 0.048), 0px 8px 16px rgba(0, 0, 0, 0.08), 0px -1px 2px rgba(0, 0, 0, 0.04)",
        large:
          "0px 1.1px 1.1px rgba(0, 0, 0, 0.028), 0px 3px 3px rgba(0, 0, 0, 0.04), 0px 24px 24px rgba(0, 0, 0, 0.08), 0px -1px 2px rgba(0, 0, 0, 0.08)",
        "extra-large":
          "0px 1.1px 1.1px rgba(0, 0, 0, 0.025), 0px 2.8px 2.8px rgba(0, 0, 0, 0.035), 0px 5.7px 5.7px rgba(0, 0, 0, 0.045), 0px 11.7px 11.7px rgba(0, 0, 0, 0.055), 0px 32px 32px rgba(0, 0, 0, 0.08), 0px -2px 4px rgba(0, 0, 0, 0.08)",
      },
      fontSize: {
        "5x-large": ["3rem", { lineHeight: "1.2" }], // 48px
        "4x-large": ["2.25rem", { lineHeight: "1.2" }], // 36px
        "3x-large": ["2rem", { lineHeight: "1.2" }], // 32px
        "2x-large": ["1.5rem", { lineHeight: "1.2" }], // 24px
        "extra-large": ["1.25rem", { lineHeight: "1.2" }], // 20px
        large: ["1.125rem", { lineHeight: "1.2" }], // 18px
        base: ["1rem", { lineHeight: "1.5" }], // 16px
        small: ["0.875rem", { lineHeight: "1.5" }], // 14px
        "extra-small": ["0.75rem", { lineHeight: "1.5" }], // 12px
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
