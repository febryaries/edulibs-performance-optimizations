import { Footer } from "@/components/ui/footer";
import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-lightest dark:bg-lightest">
      <div className="flex justify-center py-6">
        <Image src="/logo.svg" alt="EduApps Logo" width={120} height={40} />
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
          {children}
      </div>
      <Footer navItems={[
        {
          href: "/contact",
          label: "Contact",
        },
        {
          href: "/terms",
          label: "Terms",
        },
        {
          href: "/privacy",
          label: "Privacy",
        }
      ]}/>
    </div>
  );
}
