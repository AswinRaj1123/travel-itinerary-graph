import "./globals.css";

export const metadata = {
  title: "Wayfare | Find your next journey",
  description: "Compare routes and discover better ways to travel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
