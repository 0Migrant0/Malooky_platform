import type { ReactNode } from "react";

export default function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 26 }}>
      {kicker && <span className="kicker" style={{ marginBottom: 12 }}>{kicker}</span>}
      <h2 className="section-title" style={{ marginTop: kicker ? 14 : 0 }}>{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </div>
  );
}
