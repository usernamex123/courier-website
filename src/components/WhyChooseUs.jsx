import { motion } from "framer-motion";
import { ShieldCheck, Zap, Headphones, Route } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Secure Delivery",
    text: "Your packages are handled with care from pickup to final destination.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    text: "Optimized operations help us deliver shipments faster and efficiently.",
  },
  {
    icon: Route,
    title: "Smart Routing",
    text: "Advanced route planning helps reduce delays and improve reliability.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    text: "Our team is ready to help whenever you need assistance.",
  },
];

function WhyChooseUs() {
  return (
    <section
      className="
        bg-slate-950
        text-white
        py-28
        px-8
      "
    >

      <div className="max-w-7xl mx-auto">


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
            mb-16
          "
        >

          <h2 className="
            text-5xl
            font-black
          ">
            Why Choose Us
          </h2>

          <p className="
            text-gray-400
            mt-5
            text-lg
            max-w-2xl
            mx-auto
          ">
            Built around reliability, speed, and a better delivery experience.
          </p>

        </motion.div>



        <div className="
          grid
          md:grid-cols-4
          gap-6
        ">


          {reasons.map((reason,index)=>{

            const Icon = reason.icon;

            return (

              <motion.div
                key={reason.title}
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
                  delay:index*0.15
                }}
                whileHover={{
                  y:-8
                }}
                className="
                  bg-slate-900
                  border
                  border-white/10
                  rounded-3xl
                  p-8
                  text-center
                  transition
                "
              >

                <div className="
                  w-16
                  h-16
                  mx-auto
                  rounded-2xl
                  bg-blue-500/20
                  flex
                  items-center
                  justify-center
                  mb-6
                ">

                  <Icon
                    size={32}
                    className="text-blue-400"
                  />

                </div>


                <h3 className="
                  text-xl
                  font-bold
                  mb-3
                ">
                  {reason.title}
                </h3>


                <p className="
                  text-gray-400
                ">
                  {reason.text}
                </p>


              </motion.div>

            );

          })}


        </div>


      </div>

    </section>
  );
}

export default WhyChooseUs;