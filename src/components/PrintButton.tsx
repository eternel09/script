"use client";

export default function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="btn-accent" onClick={() => window.print()}>
      {children}
    </button>
  );
}
