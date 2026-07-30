import { createClient } from '@libsql/client';

let client = null;

export function getDb() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'libsql://finmo-sarleta-fintra.aws-ap-northeast-1.turso.io';
    const authToken = process.env.TURSO_AUTH_TOKEN || '';
    
    client = createClient({
      url,
      authToken
    });
  }
  return client;
}
