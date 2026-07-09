import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


function BackToTop() {

  const [visible, setVisible] = useState(false);


  useEffect(() => {

    function handleScroll(){

      if(window.scrollY > 500){
        setVisible(true);
      }
      else{
        setVisible(false);
      }

    }


    window.addEventListener(
      "scroll",
      handleScroll
    );


    return () => {

      window.removeEventListener(
        "scroll",
        handleScroll
      );

    };


  },[]);




  function scrollTop(){

    window.scrollTo({
      top:0,
      behavior:"smooth",
    });

  }




  return (

    <AnimatePresence>

      {visible && (

        <motion.button

          initial={{
            opacity:0,
            scale:0.5,
            y:20
          }}

          animate={{
            opacity:1,
            scale:1,
            y:0
          }}

          exit={{
            opacity:0,
            scale:0.5,
            y:20
          }}

          transition={{
            duration:0.3
          }}

          onClick={scrollTop}

          className="
            fixed
            bottom-6
            right-6
            z-50
            w-14
            h-14
            rounded-full
            bg-blue-500
            hover:bg-blue-600
            text-white
            shadow-xl
            flex
            items-center
            justify-center
            transition
          "

        >

          <ArrowUp size={26}/>


        </motion.button>

      )}


    </AnimatePresence>

  );

}


export default BackToTop;