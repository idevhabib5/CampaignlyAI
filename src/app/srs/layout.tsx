import "./srs.css";

export default function SrsLayout({ children }: { children: React.ReactNode }) {
  return <div className="srs-scope text-[var(--ink)]">{children}</div>;
}
