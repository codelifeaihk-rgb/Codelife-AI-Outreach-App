// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/src/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "CodeLife Outreach",
  description: "AI-powered outreach platform by CodeLife.ai",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          {/* Prevents transition flash on initial theme load */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('codelife-theme') || 'light';
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    }
                    // Add theme-ready after a tick to enable transitions
                    setTimeout(function() {
                      document.documentElement.classList.add('theme-ready');
                    }, 0);
                  } catch(e) {}
                })();
              `,
            }}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="codelife-theme"
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}