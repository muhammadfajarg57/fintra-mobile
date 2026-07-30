import { createClient } from '@libsql/client';

let client = null;

export function getDb() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'libsql://finmo-sarleta-fintra.aws-ap-northeast-1.turso.io';
    const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODUyMjY3MTEsImlkIjoiMDE5ZmE3Y2QtYWQwMS03ZWMxLWFmNzktYWY2MTA1ZTA1NDA1Iiwia2lkIjoiYWlJVXV3SklpYTFGU0pzYWZ5ZlFBQ1Y5Q1d0bTV6U2xNdGh3ZFdQVzRkZyIsInJpZCI6ImUxNjk2NjMzLTY2OTMtNGQ0MS1hODg4LTAxZjVkMTMyYzM1YyJ9.3dtsRI9ue4d5RuCICYN6q3H-yM0mBezLfCio29kGb-ZivbxvkABVEu8TnqneUNj7OZM_J59zRHnYnv-0-DOZAA';
    
    client = createClient({
      url,
      authToken
    });
  }
  return client;
}
