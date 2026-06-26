export const metadata = {
  title: "Eventicious MCP Remote Connector",
  description: "Remote MCP connector for Eventicious External API v2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
