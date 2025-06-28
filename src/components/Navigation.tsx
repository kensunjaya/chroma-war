import Link from "next/link";
import { FaGithub, FaLinkedin } from "react-icons/fa";

interface NavigationProps {
  currentPage: 'ai' | 'twoplayers' | 'multiplayer';
}
export const Navigation = ({ currentPage }: NavigationProps) => {
  return (
    <div className="flex flex-col pt-5">
      <div className="flex flex-row text-3xl xs:text-3xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl text-center justify-between items-center">
        <FaLinkedin className="hover:cursor-pointer" onClick={() => window.open("https://www.linkedin.com/in/kenneth-sunjaya/", "_blank")} />
        <h1 className="text-center hover:cursor-default font-bold">{"Chroma War"}</h1>
        <FaGithub className="hover:cursor-pointer" onClick={() => window.open("https://github.com/kensunjaya/", "_blank")} />
      </div>
      <div className="flex items-center text-xs md:text-lg justify-center p-4 text-white w-full">
        <nav className="justify-around lg:space-x-6 flex flex-row items-center">
          <Link
            href="/"
            className={`hover:cursor-pointer hover:scale-120 transition px-3 rounded-sm ${currentPage === 'ai' && 'text-cyan-700 dark:text-blue-300'}`}
          >
            Versus AI
          </Link>
          <Link
            href="/twoplayers"
            className={`hover:cursor-pointer hover:scale-120 transition px-3 rounded-sm ${currentPage === 'twoplayers' && 'text-cyan-700 dark:text-blue-300'}`}
          >
            Pass and Play
          </Link>
          <Link
            href="/multiplayer"
            className={`hover:cursor-pointer hover:scale-120 transition px-3 rounded-sm ${currentPage === 'multiplayer' && 'text-cyan-700 dark:text-blue-300'}`}
          >
            Multiplayer
          </Link>
        </nav>
      </div>
    </div>
  );
};
