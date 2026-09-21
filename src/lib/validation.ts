import { z } from 'zod';
import { normalizePhone } from './format';
import { CATEGORY_SLUGS } from './categories';

export const OCCASIONS = CATEGORY_SLUGS;
export const THEMES = ['romantico', 'elegante', 'divertido', 'minimalista', 'familiar', 'celebracao', 'gala', 'natureza'] as const;
export const TONES = ['romantico', 'emocionante', 'divertido', 'elegante', 'simples', 'poetico'] as const;
export const AMBIENTS = ['none', 'piano-suave', 'chuva-leve', 'ondas'] as const;

const name = z.string().trim().min(1, 'Este campo é obrigatório.').max(80, 'Máximo de 80 caracteres.');

export const contactSchema = z.string().trim().min(1, 'Indica um email ou número de WhatsApp.').superRefine((v, ctx) => {
  const isEmail = z.string().email().safeParse(v).success;
  if (!isEmail && !normalizePhone(v)) ctx.addIssue({ code: 'custom', message: 'Indica um email válido ou um telefone (ex.: 923 456 789).' });
});

export const createOrderSchema = z.object({
  occasion: z.enum(OCCASIONS),
  planId: z.number().int().positive(),
  recipientName: name,
  senderName: name,
  customerName: name.optional(),
  title: z.string().trim().min(1, 'Dá um título à experiência.').max(120),
  specialDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').optional().or(z.literal('')),
  contact: contactSchema,
  language: z.enum(['pt', 'en']).default('pt'),
  theme: z.enum(THEMES).default('romantico'),
  extra: z.record(z.string(), z.string().max(700)).optional(),
});

export const memorySchema = z.object({
  title: z.string().trim().max(100).default(''),
  description: z.string().trim().max(600).default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

export const letterPatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  intro: z.string().trim().max(400).optional(),
  mainMessage: z.string().trim().max(6000).optional(),
  closingMessage: z.string().trim().max(300).optional(),
  howMet: z.string().trim().max(1000).optional(),
  admire: z.string().trim().max(1000).optional(),
  tone: z.enum(TONES).optional(),
  theme: z.enum(THEMES).optional(),
  specialDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  musicMode: z.enum(['none', 'own', 'ambient', 'library']).optional(),
  ambient: z.enum(AMBIENTS).optional(),
  musicRightsAck: z.boolean().optional(),
  allowReply: z.boolean().optional(),
  unlockAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Data e hora inválidas.').or(z.literal('')).optional(),
  pin: z.string().regex(/^\d{4,6}$/, 'O PIN deve ter 4 a 6 números.').or(z.literal('')).optional(),
  memories: z.array(memorySchema).max(8).optional(),
  extra: z.record(z.string(), z.string().max(700)).optional(),
  recipientName: name.optional(),
  senderName: name.optional(),
  aiUsed: z.boolean().optional(),
});
export type LetterPatch = z.infer<typeof letterPatchSchema>;

export const aiRequestSchema = z.object({
  action: z.enum(['generate_letter', 'rewrite_tone', 'suggest_title', 'suggest_closing', 'fix_grammar', 'summarize', 'photo_caption']),
  recipientName: z.string().trim().max(80).default(''),
  senderName: z.string().trim().max(80).default(''),
  occasion: z.string().trim().max(40).default(''),
  category: z.string().trim().max(40).default('outra'),
  extra: z.record(z.string(), z.string().max(700)).default({}),
  tone: z.enum(TONES).default('simples'),
  howMet: z.string().trim().max(1000).default(''),
  admire: z.string().trim().max(1000).default(''),
  memories: z.array(z.object({ title: z.string().max(100).default(''), description: z.string().max(600).default('') })).max(8).default([]),
  text: z.string().trim().max(6000).default(''),
  photoHint: z.string().trim().max(200).default(''),
});
export type AiRequest = z.infer<typeof aiRequestSchema>;

export function firstError(e: z.ZodError): string {
  return e.issues[0]?.message || 'Dados inválidos.';
}
