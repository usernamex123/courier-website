import { motion } from "framer-motion";


function Reveal({
  children,
  delay = 0,
  y = 50,
  duration = 0.7,
}) {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: y,
      }}

      whileInView={{
        opacity: 1,
        y: 0,
      }}

      viewport={{
        once: true,
        amount: 0.2,
      }}

      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut",
      }}

    >

      {children}

    </motion.div>

  );

}


export default Reveal;