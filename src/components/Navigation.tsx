import Link from "next/link";

export const Navigation = () => {
  return (
    <div className="flex items-center justify-center p-4 text-white">
      <nav className="space-x-6 flex flex-row items-center justify-center">
        <Link href="/" className="hover:text-gray-400">Versus AI</Link>
        <Link href="/twoplayers" className="hover:text-gray-400">Pass and Play</Link>
        <Link href="/multiplayer" className="hover:text-gray-400">Multiplayer</Link>
      </nav>
    </div>
  );  
}