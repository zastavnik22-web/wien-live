export const metadata = {
  title: "Wien Live",
  description: "Brzi pregledi polazaka u Beču",

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wien Live"
  }
};

export default function Layout({ children }) {
  return (
    <html lang="bs">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}