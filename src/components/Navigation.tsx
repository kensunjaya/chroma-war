import Link from "next/link";
import { motion } from "framer-motion";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";

interface NavigationProps {
  currentPage: 'vsllm' | 'minimax' | 'twoplayers' | 'multiplayer' | 'aivsai';
}
export const Navigation = ({ currentPage }: NavigationProps) => {
  return (
    <div className="flex flex-col pt-6 font-title text-primary">
      <div className="flex flex-row text-3xl md:text-4xl text-center justify-between items-center">
        <Image 
          src="/logo.svg"
          alt="Creator"
          title="Creator"
          width={32}
          height={32}
          className="cursor-pointer" 
          onClick={() => window.open("https://kennethsunjaya.com", "_blank")} 
        />
        <h1 className="text-center text-3xl md:text-4xl select-none cursor-pointer" onClick={() => window.open("https://kennethsunjaya.com/projects/chroma-war", "_blank")}>
          CHROMA WAR
        </h1>
        <FaGithub title="GitHub" className="cursor-pointer" onClick={() => window.open("https://github.com/kensunjaya/", "_blank")} />
      </div>
      <div className="flex items-center font-primary font-medium text-sm md:text-lg justify-center pt-6 pb-4 w-full">
        <nav className="justify-around gap-6 lg:gap-10 flex flex-row items-center">
          <motion.div
            whileHover={{ scale: currentPage === 'minimax' ? 1 : 1.1 }}
            className={`rounded-sm ${currentPage === 'minimax' ? 'text-fourth' : 'cursor-pointer hover:opacity-50'}`}
          >
            <Link href="/singleplayer">
              Versus AI
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: currentPage === 'aivsai' ? 1 : 1.1 }}
            className={`rounded-sm ${currentPage === 'aivsai' ? 'text-fourth' : 'cursor-pointer hover:opacity-50'}`}
          >
            <Link
              href="/aivsai"
            >
              AI Battle
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: currentPage === 'twoplayers' ? 1 : 1.1 }}
            className={`rounded-sm ${currentPage === 'twoplayers' ? 'text-fourth' : 'cursor-pointer hover:opacity-50'}`}
          >
            <Link
              href="/twoplayers"
            >
              2P Local
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: currentPage === 'multiplayer' ? 1 : 1.1 }}
          >
            <Link
              href="/multiplayer"
              className={`rounded-sm ${currentPage === 'multiplayer' ? 'text-fourth' : 'cursor-pointer'}`}
            >
              Online Play
            </Link>
          </motion.div>
        </nav>
      </div>
    </div>
  );
};
