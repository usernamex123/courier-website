import { motion } from "framer-motion";
import { Package, Menu, X } from "lucide-react";
import { useState } from "react";

function Navbar() {

  const [open, setOpen] = useState(false);


  const links = [
    {
      name: "Home",
      link: "home",
    },
    {
      name: "Services",
      link: "services",
    },
    {
      name: "Tracking",
      link: "tracking",
    },
    {
      name: "Contact",
      link: "contact",
    },
  ];


  return (
    <motion.nav
      initial={{ y:-80, opacity:0 }}
      animate={{ y:0, opacity:1 }}
      transition={{ duration:0.6 }}
      className="
        fixed
        top-0
        left-0
        w-full
        z-50
        bg-slate-950/70
        backdrop-blur-xl
        border-b
        border-white/10
      "
    >

      <div className="
        max-w-7xl
        mx-auto
        px-8
        py-5
        flex
        items-center
        justify-between
      ">


        {/* Logo */}
        <a
          href="#home"
          className="flex items-center gap-3"
        >

          <div className="
            w-11
            h-11
            rounded-xl
            bg-blue-500
            flex
            items-center
            justify-center
          ">
            <Package
              size={25}
            />
          </div>


          <div>

            <h1 className="
              text-2xl
              font-black
            ">
              Swift
              <span className="text-blue-400">
                Ship
              </span>
            </h1>


            <p className="
              text-xs
              text-gray-400
            ">
              Logistics Solutions
            </p>

          </div>


        </a>



        {/* Desktop Menu */}
        <div className="
          hidden
          md:flex
          gap-8
        ">

          {links.map(item=>(

            <a
              key={item.name}
              href={`#${item.link}`}
              className="
                text-gray-300
                hover:text-blue-400
                transition
              "
            >
              {item.name}
            </a>

          ))}

        </div>



        <button className="
          hidden
          md:block
          bg-blue-500
          px-6
          py-3
          rounded-xl
          font-bold
        ">
          Get Quote
        </button>



        {/* Mobile Button */}
        <button
          className="
            md:hidden
            text-white
          "
          onClick={()=>setOpen(!open)}
        >

          {open
            ?
            <X size={30}/>
            :
            <Menu size={30}/>
          }

        </button>


      </div>



      {/* Mobile Menu */}

      {open && (

        <div className="
          md:hidden
          bg-slate-950
          border-t
          border-white/10
          px-8
          py-6
          space-y-5
        ">

          {links.map(item=>(

            <a
              key={item.name}
              href={`#${item.link}`}
              onClick={()=>setOpen(false)}
              className="
                block
                text-gray-300
                hover:text-blue-400
              "
            >
              {item.name}
            </a>

          ))}


          <button className="
            bg-blue-500
            w-full
            py-3
            rounded-xl
            font-bold
          ">
            Get Quote
          </button>


        </div>

      )}


    </motion.nav>
  );
}

export default Navbar;