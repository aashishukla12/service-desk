import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "ServiceDesk — Helpdesk & Support Platform",
  description:
    "Enterprise customer support platform with ticket management, SLA enforcement, knowledge base, and AI-powered assistance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f1117" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
