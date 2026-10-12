import path from 'node:path';
import { sessionSecret } from './secrets';

export const config = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  dataDir: path.resolve(process.env.DATA_DIR || './data'),
  /** Resolvido em segurança (ver secrets.ts): nunca usa o valor de exemplo em produção. */
  get sessionSecret() { return sessionSecret(); },
  aiProvider: (process.env.AI_PROVIDER || 'none') as 'anthropic' | 'mock' | 'none',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  waToken: process.env.WHATSAPP_TOKEN || '',
  waPhoneId: process.env.WHATSAPP_PHONE_ID || '',
  aiModel: process.env.AI_MODEL || 'claude-sonnet-4-5',
};
