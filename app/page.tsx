export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Eventicious MCP Remote Connector</h1>
      <p>Remote MCP server for Eventicious External API v2</p>
      <ul>
        <li><a href='/health'>Health Check</a> - GET /health</li>
        <li><a href='/mcp'>MCP Endpoint</a> - POST /mcp</li>
      </ul>
      <h2>Quick Start</h2>
      <ol>
        <li>Configure MCP client with remote URL: <code>{'{base}/mcp'}</code></li>
        <li>Pass Eventicious credentials via headers</li>
        <li>Use tools: auth_check, create_users, update_users, etc.</li>
      </ol>
      <p>All write operations default to <code>dry_run=true</code></p>
    </main>
  );
}
