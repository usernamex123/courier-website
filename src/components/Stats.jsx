import { motion } from "framer-motion";
import { Package, Map, Clock, Users } from "lucide-react";

const stats = [
  {
    icon: Package,
    number: "0+",
    title: "Packages Delivered",
  },
  {
    icon: Map,
    number: "0",
    title: "Locations Covered",
  },
  {
    icon: Clock,
    number: "0%",
    title: "On-Time Delivery",
  },
  {
    icon: Users,
    number: "0",
    title: "Happy Customers",
  },
];

function Stats() {
  return (
    <section
      className="
        bg-slate-900
        text-white
        py-24
        px-8
      "
    >

      <div className="max-w-7xl mx-auto">

        <div
          className="
            grid
            md:grid-cols-4
            gap-6
          "
        >

          {stats.map((stat,index)=>{

            const Icon = stat.icon;

            return (

              <motion.div
                key={stat.title}
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
                transition={{
                  delay:index*0.15
                }}
                whileHover={{
                  scale:1.05
                }}
                className="
                  bg-slate-950
                  border
                  border-white/10
                  rounded-3xl
                  p-8
                  text-center
                "
              >

                <div className="
                  w-14
                  h-14
                  mx-auto
                  mb-5
                  rounded-2xl
                  bg-blue-500/20
                  flex
                  items-center
                  justify-center
                ">

                  <Icon
                    size={30}
                    className="text-blue-400"
                  />

                </div>


                <h3 className="
                  text-5xl
                  font-black
                  text-blue-400
                ">
                  {stat.number}
                </h3>


                <p className="
                  mt-3
                  text-gray-400
                ">
                  {stat.title}
                </p>


              </motion.div>

            );

          })}

        </div>

      </div>

    </section>
  );
}

export default Stats;