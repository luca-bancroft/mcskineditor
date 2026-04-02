export const metadata = {
  title: "MC Skin Editor",
  description: "Minecraft skin editor",
};

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/hack-font@3/build/web/hack.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}