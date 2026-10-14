// Mensagens do formulário de contacto (o contacto fica cifrado na base de dados).
import { all, run, Row } from './db';
import { cleanText, encryptText, decryptText } from './security';

export function saveContactMessage(input: { name: string; contact: string; message: string }) {
  run('INSERT INTO contact_messages(name, contact, message) VALUES(?,?,?)', cleanText(input.name, 80), encryptText(cleanText(input.contact, 120)), cleanText(input.message, 1500));
}
export function listContactMessages(limit = 100): Row[] {
  return all('SELECT * FROM contact_messages ORDER BY id DESC LIMIT ?', limit).map(m => ({ ...m, contact: decryptText(m.contact) || '' }));
}
