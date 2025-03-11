import Link from "next/link";
import AuthStatus from "./AuthStatus";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          결제 시스템 데모
        </Link>
        <AuthStatus />
      </div>
    </header>
  );
}
