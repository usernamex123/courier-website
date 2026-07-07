import { motion } from "framer-motion";
import { ArrowRight, Package, MapPin } from "lucide-react";

function Hero() {
  return (
    <section
      id="home"
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-slate-950
        text-white
        flex
        items-center
        px-8
        pt-32
      "
    >

      {/* Background Glow */}
      <div
        className="
          absolute
          w-[500px]
          h-[500px]
          bg-blue-500/20
          rounded-full
          blur-[130px]
          right-0
          top-20
        "
      />


      <div
        className="
          max-w-7xl
          mx-auto
          grid
          md:grid-cols-2
          gap-12
          items-center
          relative
          z-10
        "
      >

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >

          <h1
            className="
              text-6xl
              md:text-7xl
              font-black
              leading-tight
            "
          >
            Delivering
            <span className="text-blue-400">
              {" "}Trust.
            </span>

            <br />

            Across America.
          </h1>


          <p
            className="
              mt-6
              text-xl
              text-gray-400
              max-w-xl
            "
          >
            Modern courier solutions with real-time tracking,
            optimized delivery routes, and secure package handling.
          </p>


          <div className="flex gap-5 mt-10">

            <button
              className="
                bg-blue-500
                hover:bg-blue-600
                px-7
                py-4
                rounded-2xl
                font-bold
                flex
                items-center
                gap-2
                transition
              "
            >
              Start Shipping
              <ArrowRight size={20}/>
            </button>


            <button
              className="
                border
                border-white/20
                hover:bg-white/10
                px-7
                py-4
                rounded-2xl
                font-bold
                transition
              "
            >
              Track Package
            </button>

          </div>

        </motion.div>



        {/* Delivery Visual */}
        <motion.div
          initial={{ opacity:0, scale:0.8 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ duration:1 }}
          className="flex justify-center"
        >

          <div
            className="
              relative
              w-[420px]
              h-[420px]
              rounded-3xl
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              flex
              items-center
              justify-center
              overflow-hidden
            "
          >

            <motion.div
              animate={{
                x:[-120,120,-120]
              }}
              transition={{
                duration:4,
                repeat:Infinity
              }}
              className="
                absolute
                w-5
                h-5
                rounded-full
                bg-blue-400
              "
            />


            <div
              className="
                absolute
                w-72
                h-1
                bg-blue-400/30
                rotate-12
              "
            />


            <motion.div
              animate={{
                y:[0,-15,0]
              }}
              transition={{
                duration:2,
                repeat:Infinity
              }}
              className="
                w-44
                h-44
                rounded-3xl
                bg-blue-500/20
                border
                border-blue-400/40
                flex
                items-center
                justify-center
              "
            >

              <Package
                size={110}
                className="text-blue-400"
              />

            </motion.div>


            <MapPin
              size={40}
              className="
                absolute
                bottom-12
                right-12
                text-blue-400
              "
            />

          </div>

        </motion.div>

      </div>

    </section>
  );
}

export default Hero;
