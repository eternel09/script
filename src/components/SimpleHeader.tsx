import { Logo } from "./Header";

export default function SimpleHeader() {
  return (
    <header className="no-print border-b border-line bg-white">
      <div className="mx-auto flex max-w-xl items-center px-4 py-2">
        <Logo />
      </div>
    </header>
  );
}
