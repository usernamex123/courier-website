import { motion } from "framer-motion";
import { Truck, Clock, Globe, PackageCheck } from "lucide-react";

const services = [
  {
    icon: Truck,
    title: "Express Delivery",
    text: "Fast delivery solutions designed for urgent shipments and time-sensitive packages.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    text: "Monitor your shipment status with accurate updates from pickup to delivery.",
  },
  {
    icon: Globe,
    title: "Nationwide Coverage",
    text: "Reliable courier services connecting customers and businesses across America.",
  },
  {
    icon: PackageCheck,
    title: "Secure Handling",
    text: "Every package is handled carefully with safety and reliability in mind.",
  },
];

function Services() {
  return (
    <section
      id="services"
      className="
        bg-slate-900
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
            Our Services
          </h2>

          <p className="
            text-gray-400
            mt-5
            text-lg
            max-w-2xl
            mx-auto
          ">
            Complete courier solutions built around speed,
            transparency, and customer trust.
          </p>

        </motion.div>



        <div className="
          grid
          md:grid-cols-2
          gap-8
        ">


          {services.map((service,index)=>{

            const Icon = service.icon;

            return (

              <motion.div
                key={service.title}
                initial={{
                  opacity:0,
                  y:60
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
                  y:-10
                }}
                className="
                  relative
                  overflow-hidden
                  bg-slate-950
                  border
                  border-white/10
                  rounded-3xl
                  p-10
                  transition
                "
              >

                <div
                  className="
                    absolute
                    w-32
                    h-32
                    bg-blue-500/20
                    rounded-full
                    blur-3xl
                    -right-10
                    -top-10
                  "
                />


                <Icon
                  size={50}
                  className="
                    text-blue-400
                    mb-6
                    relative
                  "
                />


                <h3
                  className="
                    text-3xl
                    font-bold
                    mb-4
                    relative
                  "
                >
                  {service.title}
                </h3>


                <p
                  className="
                    text-gray-400
                    text-lg
                    relative
                  "
                >
                  {service.text}
                </p>


              </motion.div>

            );

          })}


        </div>


      </div>

    </section>
  );
}

export default Services;