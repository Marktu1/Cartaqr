import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';
export const metadata: Metadata = { title: 'Entrar · Admin', robots: { index: false, follow: false } };
export default function AdminLogin() { return <LoginForm />; }
