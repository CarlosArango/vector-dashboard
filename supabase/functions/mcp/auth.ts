// supabase/functions/mcp/auth.ts
//
// Pure helpers for OAuth bearer handling and MCP authorization discovery
// (RFC 9728 protected-resource metadata). No I/O.

/** Extract the token from an `Authorization: Bearer <token>` header value. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(\S+)\s*$/i);
  return match ? match[1] : null;
}

/** True when the request path is the function's protected-resource metadata endpoint. */
export function isMetadataPath(pathname: string): boolean {
  return pathname.endsWith('/.well-known/oauth-protected-resource');
}

/** RFC 9728 protected-resource metadata, pointing clients at Supabase Auth. */
export function protectedResourceMetadata(supabaseUrl: string) {
  const base = supabaseUrl.replace(/\/+$/, '');
  return {
    resource: `${base}/functions/v1/mcp`,
    authorization_servers: [`${base}/auth/v1`],
    bearer_methods_supported: ['header'],
  };
}

/** WWW-Authenticate value that tells MCP clients where to find the metadata. */
export function wwwAuthenticate(supabaseUrl: string): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  return `Bearer resource_metadata="${base}/functions/v1/mcp/.well-known/oauth-protected-resource"`;
}
