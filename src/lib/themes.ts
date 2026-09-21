export const THEME_INFO: Record<string, { name: string; description: string; vars: Record<string, string> }> = {
  romantico:   { name: 'Romântico',   description: 'Rosa suave e vinho',        vars: { '--c-bg': '#FBF1EE', '--c-card': '#FFFDF9', '--c-accent': '#6B1B34', '--c-soft': '#F6DDDD', '--c-ink': '#3A1C24' } },
  elegante:    { name: 'Elegante',    description: 'Creme e dourado discreto',  vars: { '--c-bg': '#F7F1E6', '--c-card': '#FFFDF8', '--c-accent': '#94722D', '--c-soft': '#EFE3C8', '--c-ink': '#2B2418' } },
  divertido:   { name: 'Divertido',   description: 'Terracota e energia',       vars: { '--c-bg': '#FFF3E8', '--c-card': '#FFFDF9', '--c-accent': '#C2502E', '--c-soft': '#FBD9C3', '--c-ink': '#3B2015' } },
  minimalista: { name: 'Minimalista', description: 'Limpo e sereno',            vars: { '--c-bg': '#F7F5F2', '--c-card': '#FFFFFF', '--c-accent': '#2F2A2B', '--c-soft': '#E9E4DE', '--c-ink': '#231F20' } },
  familiar:    { name: 'Familiar',    description: 'Calor de casa',             vars: { '--c-bg': '#FBF3E4', '--c-card': '#FFFDF7', '--c-accent': '#9C4A2B', '--c-soft': '#F1DEC0', '--c-ink': '#33231A' } },
  gala:        { name: 'Gala',        description: 'Noite elegante e dourado',  vars: { '--c-bg': '#1F1A1C', '--c-card': '#2A2326', '--c-accent': '#D9B76E', '--c-soft': '#3A3034', '--c-ink': '#F4ECE0' } },
  natureza:    { name: 'Natureza',    description: 'Verde suave e leve',        vars: { '--c-bg': '#F1F5EC', '--c-card': '#FBFDF8', '--c-accent': '#4E6B3F', '--c-soft': '#DCE8CF', '--c-ink': '#25301F' } },
  celebracao:  { name: 'Celebração',  description: 'Festa com toque dourado',   vars: { '--c-bg': '#FBF0EA', '--c-card': '#FFFDF9', '--c-accent': '#A3283F', '--c-soft': '#F5D9C9', '--c-ink': '#3A1C24' } },
};
export function themeStyle(theme: string): React.CSSProperties {
  return (THEME_INFO[theme] || THEME_INFO.romantico).vars as React.CSSProperties;
}
