import { motion } from "framer-motion";
import {
  PackageOpen,
  Truck,
  CheckCircle
} from "lucide-react";


const steps = [
  {
    icon: PackageOpen,
    number: "01",
    title: "Package Pickup",
    text: "We collect your package from your location safely and quickly.",
  },
  {
    icon: Truck,
    number: "02",
    title: "In Transit",
    text: "Your shipment moves through optimized delivery routes.",
  },
  {
    icon: CheckCircle,
    number: "03",
    title: "Delivered",
    text: "Your package arrives safely at its destination.",
  },
];


function HowItWorks() {

  return (

    <section
      className="
        bg-slate-950
        text-white
        py-28
        px-8
      "
    >

      <div className="
        max-w-7xl
        mx-auto
      ">


        <motion.div
          initial={{
            opacity:0,
            y:40
          }}
          whileInView={{
            opacity:1,
            y:0
          }}
          viewport={{
            once:true
          }}
          className="
            text-center
            mb-20
          "
        >

          <p className="
            text-blue-400
            font-bold
            tracking-widest
            mb-4
          ">
            DELIVERY PROCESS
          </p>


          <h2 className="
            text-5xl
            font-black
          ">
            How It Works
          </h2>


          <p className="
            text-gray-400
            mt-5
            text-lg
          ">
            Simple, transparent, and reliable delivery process.
          </p>


        </motion.div>




        <div className="
          relative
          grid
          md:grid-cols-3
          gap-8
        ">


          {/* Connection Line */}

          <div className="
            hidden
            md:block
            absolute
            top-32
            left-[20%]
            right-[20%]
            h-px
            bg-blue-400/20
          " />



          {steps.map((step,index)=>{

            const Icon = step.icon;


            return (

              <motion.div

                key={step.number}

                initial={{
                  opacity:0,
                  y:50
                }}

                whileInView={{
                  opacity:1,
                  y:0
                }}

                viewport={{
                  once:true
                }}

                transition={{
                  delay:index * 0.2
                }}

                whileHover={{
                  y:-10
                }}

                className="
                  relative
                  bg-slate-900
                  border
                  border-white/10
                  rounded-3xl
                  p-10
                  text-center
                  overflow-hidden
                  group
                "
              >


                {/* Glow */}

                <div
                  className="
                    absolute
                    w-40
                    h-40
                    bg-blue-500/20
                    rounded-full
                    blur-3xl
                    -top-10
                    -right-10
                    group-hover:bg-blue-500/30
                    transition
                  "
                />



                <div className="
                  absolute
                  top-6
                  right-8
                  text-5xl
                  font-black
                  text-white/10
                ">
                  {step.number}
                </div>




                <div className="
                  relative
                  w-20
                  h-20
                  mx-auto
                  rounded-3xl
                  bg-blue-500/20
                  flex
                  items-center
                  justify-center
                  mb-7
                ">

                  <Icon
                    size={40}
                    className="text-blue-400"
                  />

                </div>



                <h3 className="
                  relative
                  text-2xl
                  font-bold
                  mb-4
                ">
                  {step.title}
                </h3>



                <p className="
                  relative
                  text-gray-400
                  leading-relaxed
                ">
                  {step.text}
                </p>



              </motion.div>

            );

          })}


        </div>


      </div>


    </section>

  );
}


export default HowItWorks;