// Segredo 3 — transição entre páginas: o template volta a montar a cada navegação, por isso a página nova entra com um fade suave
// em vez de aparecer de repente.
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
