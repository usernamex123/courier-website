import { motion } from "framer-motion";
import { Search, Package, MapPin, Truck } from "lucide-react";

function Tracking() {
  return (
    <section
      id="tracking"
      className="
        bg-slate-900
        text-white
        py-28
        px-8
      "
    >

      <div className="
        max-w-5xl
        mx-auto
      ">


        <motion.div
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
          className="
            bg-slate-950
            border
            border-white/10
            rounded-3xl
            p-10
            md:p-14
            text-center
          "
        >


          <div className="
            w-20
            h-20
            mx-auto
            rounded-3xl
            bg-blue-500/20
            flex
            items-center
            justify-center
            mb-8
          ">

            <Package
              size={45}
              className="text-blue-400"
            />

          </div>



          <h2 className="
            text-5xl
            font-black
          ">
            Track Your Shipment
          </h2>


          <p className="
            text-gray-400
            text-lg
            mt-5
          ">
            Enter your tracking number to view your delivery status.
          </p>



          <div className="
            mt-10
            flex
            flex-col
            md:flex-row
            gap-4
          ">


            <input
              placeholder="Example: SS-000001"
              className="
                flex-1
                px-6
                py-4
                rounded-2xl
                bg-slate-900
                border
                border-white/10
                outline-none
                focus:border-blue-400
              "
            />


            <button
              className="
                bg-blue-500
                hover:bg-blue-600
                px-8
                py-4
                rounded-2xl
                font-bold
                flex
                justify-center
                items-center
                gap-3
                transition
              "
            >

              <Search size={20}/>

              Track

            </button>


          </div>



          <div className="
            grid
            md:grid-cols-3
            gap-5
            mt-12
          ">


            <div className="
              bg-slate-900
              rounded-2xl
              p-5
            ">

              <MapPin
                className="text-blue-400 mx-auto mb-3"
              />

              <p className="text-gray-400">
                Pickup
              </p>

            </div>



            <div className="
              bg-slate-900
              rounded-2xl
              p-5
            ">

              <Truck
                className="text-blue-400 mx-auto mb-3"
              />

              <p className="text-gray-400">
                In Transit
              </p>

            </div>



            <div className="
              bg-slate-900
              rounded-2xl
              p-5
            ">

              <Package
                className="text-blue-400 mx-auto mb-3"
              />

              <p className="text-gray-400">
                Delivered
              </p>

            </div>


          </div>


        </motion.div>


      </div>


    </section>
  );
}

export default Tracking;