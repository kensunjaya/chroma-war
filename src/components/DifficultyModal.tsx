import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface ModalProps {
  setState: () => void;
  setDifficulty: (difficulty: number) => void;
  difficulty?: number;
}

const DifficultyModal: React.FC<ModalProps> = ({setState, setDifficulty, difficulty}) => {
  const [localDifficulty, setLocalDifficulty] = useState<number>(0);
  const cardCSS = "outline-2 w-26 lg:w-60 h-auto outline-fourth cursor-pointer rounded-xl p-2 lg:p-5 flex flex-col items-center lg:justify-center space-y-2 md:space-y-3 lg:space-y-4 xl:space-y-5 transition duration-300";

  useEffect(() => {
    if (difficulty) {
      setLocalDifficulty(difficulty);
    }
  }, [difficulty]);

  const handleClick = () => {
    setState();
    setDifficulty(localDifficulty);
  }

  const handleClose = () => {
    setState();
  }

  return (  
    <div className="fixed inset-0 backdrop-opacity-80 backdrop-blur-lg backdrop-brightness-40 font-primary overflow-y-auto h-full w-full flex items-center justify-center z-999 transition duration-500 ease-in-out p-8" onClick={() => difficulty !== 0 && handleClose()}>
      <motion.div 
        className="p-3 md:p-4 lg:p-8 max-w-200 text-secondary flex flex-col items-center shadow shadow-5xl rounded-md bg-primary space-y-3" onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
      >
        <h3 className="text-2xl font-bold text-center">Select Difficulty</h3>
        <div className="flex flex-row py-3 text-sm md:text-md lg:text-lg space-x-3 lg:space-x-5">
          <motion.button 
            onClick={() => setLocalDifficulty(1)} className={`${cardCSS} ${localDifficulty === 1 && 'outline-8'}`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-md lg:text-xl font-bold">EASY</div>
            <Image src="/1.webp" height={500} width={500} className="h-14 md:h-20 lg:h-30 w-auto pointer-events-none border" alt="easy" />
            <div className="text-xs md:text-sm text-center mb-auto">{"Beginner friendly. The AI makes simple moves."}</div>
          </motion.button>
          <motion.button 
            onClick={() => setLocalDifficulty(3)} className={`${cardCSS} ${localDifficulty === 3 && 'outline-8'}`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-md lg:text-xl font-bold">MEDIUM</div>
            <Image src="/2.webp" height={500} width={500} className="h-14 md:h-20 lg:h-30 w-auto pointer-events-none" alt="med" />
            <div className="text-xs md:text-sm text-center mb-auto">{"A balanced challenge. The AI thinks a few moves ahead."}</div>
          </motion.button>
          <motion.button 
            onClick={() => setLocalDifficulty(5)} className={`${cardCSS} ${localDifficulty === 5 && 'outline-8'}`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-md lg:text-xl font-bold">HARD</div>
            <Image src="/3.webp" height={500} width={500} className="h-14 md:h-20 lg:h-30 w-auto pointer-events-none" alt="hard" />
            <div className="text-xs md:text-sm text-center mb-auto">{"For experts. The AI plays optimally."}</div>
          </motion.button>
        </div>
        {
          (localDifficulty !== difficulty && difficulty !== 0) && 
          <p className="text-red-500 text-xs md:text-sm text-center">{"Changing difficulty will reset the board."}</p>
        }
        <div className="flex flex-col justify-center mb-2 mt-3 items-center">
          <button
            onClick={handleClick}
            className="px-4 hover:cursor-pointer py-2 w-fit transition duration-300 disabled:hover:cursor-default bg-fourth disabled:bg-gray-400 text-white font-medium rounded-md shadow-sm hover:opacity-75 focus:outline-none focus:ring-2"
            disabled={localDifficulty === 0}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default DifficultyModal;