import { motion } from "framer-motion";

function Reveal({ children, delay = 0, y = 50, duration = 2.0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: y }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          type: "tween",
          duration: duration,
          delay: delay,
          ease: [0.22, 1, 0.36, 1]
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;