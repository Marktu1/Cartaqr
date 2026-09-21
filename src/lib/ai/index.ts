// Camada abstrata de IA. Troca de fornecedor com AI_PROVIDER (anthropic | mock | none).
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import type { AiRequest } from '../validation';
import { getCategory } from '../categories';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

export interface AIProvider { name: string; generate(system: string, user: string): Promise<string>; }

export class AiUnavailableError extends Error {}

class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  async generate(system: string, user: string) {
    const client = new Anthropic({ apiKey: config.anthropicKey, timeout: 25_000, maxRetries: 1 });
    const res = await client.messages.create({ model: config.aiModel, max_tokens: 1200, system, messages: [{ role: 'user', content: user }] });
    const text = res.content.map(b => (b.type === 'text' ? b.text : '')).join('').trim();
    if (!text) throw new Error('resposta vazia');
    return text;
  }
}

/** Fornecedor de demonstração: monta um rascunho simples SÓ com os dados fornecidos (não usa IA real). */
export class MockProvider implements AIProvider {
  name = 'mock';
  async generate(_system: string, _user: string) { return ''; }
  run(r: AiRequest): string {
    const to = r.recipientName || 'Meu amor';
    const mems = r.memories.filter(m => m.title || m.description);
    switch (r.action) {
      case 'generate_letter': {
        const cat = getCategory(r.category);
        if (cat.kind === 'evento') {
          const when = [r.extra.time && `às ${r.extra.time}`, r.extra.venue && `em ${r.extra.venue}`].filter(Boolean).join(' ');
          return [`${r.recipientName || 'Queridos convidados'},`, `${r.senderName || 'Nós'} teria${r.senderName ? '' : 'mos'} o maior gosto em ter-te connosco${when ? ' ' + when : ''}.`, '[Sugestão: acrescenta aqui o motivo da celebração e algo que os convidados vão adorar.]', 'Confirma a tua presença no fim desta página.'].join('\n\n');
        }
        const parts = [`${to},`];
        if (r.howMet) parts.push(`Lembro-me de como tudo começou: ${r.howMet.replace(/[.\s]+$/, '')}.`);
        if (mems.length) parts.push(`Guardo comigo momentos que não esquecem: ${mems.map(m => (m.title || m.description).replace(/[.\s]+$/, '')).join('; ')}.`);
        if (r.admire) parts.push(`O que mais admiro em ti: ${r.admire.replace(/[.\s]+$/, '')}.`);
        parts.push('[Sugestão: acrescenta aqui uma frase tua, com as palavras que só tu dirias.]');
        parts.push(r.senderName ? `Com carinho,\n${r.senderName}` : 'Com carinho');
        return parts.join('\n\n');
      }
      case 'suggest_title': return r.recipientName ? `Uma carta para ${r.recipientName}` : 'Uma carta só para ti';
      case 'suggest_closing': return 'Obrigado(a) por fazeres parte da minha história.';
      case 'summarize': return r.text.split(/(?<=[.!?])\s+/).slice(0, Math.max(1, Math.ceil(r.text.split(/(?<=[.!?])\s+/).length / 2))).join(' ');
      case 'photo_caption': return r.photoHint ? `${r.photoHint.slice(0, 60)}` : 'Um momento para guardar';
      case 'fix_grammar': case 'rewrite_tone': return r.text;
    }
  }
}

function provider(): AIProvider | MockProvider {
  if (config.aiProvider === 'anthropic' && config.anthropicKey) return new AnthropicProvider();
  if (config.aiProvider === 'mock') return new MockProvider();
  throw new AiUnavailableError('IA não configurada');
}

export function aiStatus(): { available: boolean; provider: string } {
  try { return { available: true, provider: provider().name }; } catch { return { available: false, provider: 'none' }; }
}

export async function runAi(req: AiRequest): Promise<{ text: string; provider: string }> {
  const p = provider();
  if (p instanceof MockProvider) return { text: p.run(req), provider: p.name };
  const text = await p.generate(SYSTEM_PROMPT, buildUserPrompt(req));
  return { text, provider: p.name };
}
