import Link from "next/link"
import { cn } from "@/lib/utils"

export type FooterNavItem = {
  label: string
  href: string
  external?: boolean
}

export type FooterProps = {
  /** Company or site name (not displayed in admin variant) */
  companyName?: string
  /** Copyright year (will show as © 2025) */
  copyrightYear?: number
  /** Navigation items to display */
  navItems?: FooterNavItem[]
  /** Additional CSS classes */
  className?: string
  /** Variant of the footer */
  variant?: "default" | "admin" | "minimal"
}

export function Footer({
  companyName = "",
  copyrightYear = new Date().getFullYear(),
  navItems = [],
  className,
  variant = "admin",
}: FooterProps) {
  // Admin footer variant (matching the design in the image)
  if (variant === "admin") {
    return (
      <footer className={cn("w-full border-t border-gray-200 py-4", className)}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 sm:mb-0">© {copyrightYear}</div>

            {navItems.length > 0 && (
              <nav aria-label="Footer Navigation">
                <ul className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:text-purple-600 hover:underline"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link href={item.href} className="text-sm text-gray-500 hover:text-purple-600 hover:underline">
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </footer>
    )
  }

  // Default and minimal variants remain the same
  if (variant === "minimal") {
    return (
      <footer className={cn("w-full border-t border-gray-200 py-4", className)}>
        <div className="container mx-auto px-4 text-center">
          <div className="text-sm text-gray-500">
            © {copyrightYear} {companyName}
          </div>
        </div>
      </footer>
    )
  }

  // Default footer variant
  return (
    <footer className={cn("w-full border-t border-gray-200 py-8", className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Company info */}
          <div className="md:col-span-1">
            <h2 className="mb-4 text-lg font-semibold">{companyName}</h2>
            <p className="mb-4 text-sm text-gray-500">
              Building better experiences through thoughtful design and technology.
            </p>
          </div>

          {/* Navigation links */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:col-span-2 lg:col-span-3">
            {/* Split nav items into columns */}
            {navItems.length > 0 && (
              <>
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Resources</h3>
                  <ul className="space-y-2">
                    {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item) => (
                      <li key={item.href}>
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-purple-600 hover:underline"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            className="text-sm text-gray-500 hover:text-purple-600 hover:underline"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Company</h3>
                  <ul className="space-y-2">
                    {navItems.slice(Math.ceil(navItems.length / 2)).map((item) => (
                      <li key={item.href}>
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-purple-600 hover:underline"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            className="text-sm text-gray-500 hover:text-purple-600 hover:underline"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom bar with copyright */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-500">
            © {copyrightYear} {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
