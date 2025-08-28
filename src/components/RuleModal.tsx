import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ModalProps {
  setState: () => void;
}

const RuleModal: React.FC<ModalProps> = ({setState}) => {
  const [isMobile, setIsMobile] = useState(false);

  const handleClick = () => {
    setState();
  }

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width < height) {
      setIsMobile(true);
    }
  }, []);

  return (
    <div className="fixed inset-0 backdrop-opacity-80 backdrop-blur-lg backdrop-brightness-40 font-primary overflow-y-auto h-full w-full flex items-center justify-center z-999 transition duration-500 ease-in-out p-8">
      <motion.div 
        className="p-4 lg:p-8 max-w-200 shadow shadow-5xl rounded-md bg-primary"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
      >
        <div>
          <h3 className="text-2xl font-bold text-secondary text-center">About the game</h3>
          <div className="px-4 lg:px-7 py-3 text-gray-500 text-sm md:text-md lg:text-lg space-y-2">
            <p>{"Welcome to Chroma War! This is a 2-player chain reaction strategy game played on a 6×6 grid. Each cell can hold a value (1–4) and a color (Red or Blue)."}</p>
            <p>{"Take control of the board by triggering chain reactions that eliminate your opponent's cells and convert them to your color."}</p>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row justify-between'}`}>
              <ol className="list-disc pl-4">
                <li>{"You can only tap your own color's cells."}</li>
                <li>{"Tapping a cell increases its value by 1."}</li>
                <li>{"When a cell reaches 4 dots, it explodes and affects its neighbors."}</li>
                <li>{"The game ends when one player dominates the board."}</li>
              </ol>
              <video src={isMobile ? "demo_preview_mobile.webm" : "demo_preview.webm"} className={`${isMobile ? "h-40" : "w-40"} rounded-md pointer-events-none`} autoPlay muted loop playsInline />
            </div>
            <p>{"Let the Chroma War begin, every tap matters!"}</p>
          </div>
          <div className="flex flex-col justify-center mt-2 items-center">
            <button
              onClick={() => handleClick()}
              className="px-4 hover:cursor-pointer py-2 w-fit transition duration-300 disabled:hover:cursor-default bg-fourth disabled:bg-gray-400 text-white font-medium rounded-md shadow-sm hover:opacity-75 focus:outline-none focus:ring-2"
            >
              I understand
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default RuleModal;