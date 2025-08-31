import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

interface ModalProps {
  title: string;
  body: string;
  buttonLabel: string;
  isLoading: boolean;
  input?: string;
  setState: () => void;
  setInput?: (val: string) => void;
  setOnBackgroundClick?: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, body, buttonLabel, isLoading, input, setState, setInput, setOnBackgroundClick }) => {
  const [errorMsg, setErrorMsg] = useState<string>("");
  const navigate = useRouter();

  const handleClick = () => {
    if (input) {
      if (input.length === 0) {
        setState();
        return;
      }
      if (input.length < 3) {
        setErrorMsg("Nickname must be at least 3 characters long.");
        return;
      }
    }
    setState();
  }

  return (
    <div className="fixed inset-0 backdrop-opacity-80 backdrop-blur-lg backdrop-brightness-40 font-primary overflow-y-auto h-full w-full flex items-center justify-center z-999 transition duration-300 ease-in-out" onClick={setOnBackgroundClick ? setOnBackgroundClick : () => navigate.back()}>
      <motion.div 
        className="py-8 px-10 w-96 shadow shadow-5xl rounded-md bg-primary" onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
      >
        <div className="text-center">
          <h3 className="text-2xl font-bold text-secondary">{title}</h3>
          <div className="px-7 py-3">
            <p className="text-lg text-gray-600">{body}</p>
          </div>
          {(input === "" || input) && (
            <input 
              type="text" 
              placeholder="Min 3 characters" 
              className="w-full mb-2 py-2 text-xl border-b-2 border-fifth outline-0 outline-gray-400 placeholder:opacity-50 placeholder:font-light text-center text-secondary"
              onChange={(e) => setInput && setInput(e.target.value)}
              maxLength={16}
              minLength={3}
            />
          )}
          <div className="flex flex-col justify-center mt-4 items-center">
            {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
            <button
              onClick={() => handleClick()}
              disabled={
                isLoading ||
                (input !== undefined && (input.length < 3 || input.length > 15))
              }
              className="px-4 hover:cursor-pointer py-2 w-fit transition duration-300 disabled:hover:cursor-default bg-fifth disabled:bg-gray-400 text-white font-medium rounded-md shadow-sm hover:opacity-75 disabled:hover:opacity-100 focus:outline-none focus:ring-2"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Modal;