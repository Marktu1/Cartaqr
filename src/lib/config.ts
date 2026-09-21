import path from 'node:path';

export const config = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  dataDir: path.resolve(process.env.DATA_DIR || './data'),
  sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me-please-0000',
  aiProvider: (process.env.AI_PROVIDER || 'none') as 'anthropic' | 'mock' | 'none',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  waToken: process.env.WHATSAPP_TOKEN || '',
  waPhoneId: process.env.WHATSAPP_PHONE_ID || '',
  aiModel: process.env.AI_MODEL || 'claude-sonnet-4-5',
};

export function assertProdSecrets() {
  if (process.env.NODE_ENV === 'production' && config.sessionSecret.startsWith('dev-insecure')) {
    throw new Error('SESSION_SECRET não configurado');
  }
}
