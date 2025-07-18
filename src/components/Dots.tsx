export const Dots = (val: number) => {
  const dotClass = `w-2 h-2 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:w-4 md:h-4 lg:w-5 z-101 lg:h-5 rounded-full bg-primary`;
  const dots = {
    1: [<div key="1" className="absolute w-full h-full flex items-center z-100 justify-center"><div className={dotClass} /></div>],
    2: [<div key="2a" className="absolute z-100 left-2 md:left-3 lg:left-4"><div className={dotClass} /></div>,<div key="2b" className="absolute z-100 right-2 md:right-3 lg:right-4"><div className={dotClass} /></div>],
    3: [<div key="3a" className="absolute z-100 top-2 md:top-2.5 lg:top-3"><div className={dotClass} /></div>,<div key="3b" className="absolute z-100 left-2 md:left-3 lg:left-3.5 bottom-2.5 md:bottom-4 lg:bottom-4.5"><div className={dotClass} /></div>,<div key="3c" className="absolute z-100 right-2 md:right-3 lg:right-3.5 bottom-2.5 md:bottom-4 lg:bottom-4.5"><div className={dotClass} /></div>],
    4: [<div key="4a" className="absolute z-100 left-2 top-2 md:left-3 lg:left-4 md:top-3 lg:top-4"><div className={dotClass} /></div>,<div key="4b" className="absolute z-100 right-2 top-2 md:right-3 lg:right-4 md:top-3 lg:top-4"><div className={dotClass} /></div>,<div key="4c" className="absolute z-100 left-2 md:left-3 lg:left-4 bottom-2 md:bottom-3 lg:bottom-4"><div className={dotClass} /></div>,<div key="4d" className="absolute z-100 right-2 md:right-3 lg:right-4 bottom-2 md:bottom-3 lg:bottom-4"><div className={dotClass} /></div>],
  };

  if (val >= 4) return dots[4];
  return dots[val as keyof typeof dots] || null;
};