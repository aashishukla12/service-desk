import "./globals.css";

export const metadata = {
  title: "Service Desk Portal",
  description: "Enterprise service desk portal built with Next.js and PostgreSQL."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
