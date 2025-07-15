import Link from "next/link";
import { FaGithub, FaLinkedin } from "react-icons/fa";

interface NavigationProps {
  currentPage: 'vsllm' | 'minimax' | 'twoplayers' | 'multiplayer';
}
export const Navigation = ({ currentPage }: NavigationProps) => {
  return (
    <div className="flex flex-col pt-6 font-title text-primary">
      <div className="flex flex-row text-3xl md:text-4xl text-center justify-between items-center">
        <FaLinkedin className="cursor-pointer" onClick={() => window.open("https://www.linkedin.com/in/kenneth-sunjaya/", "_blank")} />
        <h1 className="text-center text-4xl sm:text-4xl md:text-5xl select-none pointer-events-none font-bold">{"CHROMA WAR"}</h1>
        <FaGithub className="cursor-pointer" onClick={() => window.open("https://github.com/kensunjaya/", "_blank")} />
      </div>
      <div className="flex items-center font-primary font-medium text-xs md:text-lg justify-center p-4 w-full">
        <nav className="justify-around lg:space-x-6 flex flex-row items-center">
          <Link
            href="/singleplayer"
            className={`transition px-3 rounded-sm ${currentPage === 'minimax' ? 'text-fourth' : 'cursor-pointer hover:scale-110 hover:opacity-50'}`}
          >
            VERSUS AI
          </Link>
          <Link
            href="/twoplayers"
            className={`transition px-3 rounded-sm ${currentPage === 'twoplayers' ? 'text-fourth' : 'cursor-pointer hover:scale-110 hover:opacity-50'}`}
          >
            PASS & PLAY
          </Link>
          <Link
            href="/multiplayer"
            className={`transition px-3 rounded-sm ${currentPage === 'multiplayer' ? 'text-fourth' : 'cursor-pointer hover:scale-110 hover:opacity-50'}`}
          >
            MULTIPLAYER
          </Link>
        </nav>
      </div>
    </div>
  );
};
