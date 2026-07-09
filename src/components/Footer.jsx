import {
  Mail,
  Phone,
  MapPin,
  Package
} from "lucide-react";


function Footer() {

  return (

    <footer
      id="contact"
      className="
        relative
        overflow-hidden
        bg-slate-950
        text-white
        border-t
        border-white/10
        px-8
        py-16
      "
    >


      {/* Background Glow */}

      <div
        className="
          absolute
          w-96
          h-96
          bg-blue-500/10
          rounded-full
          blur-3xl
          -right-40
          -bottom-40
        "
      />



      <div className="
        relative
        max-w-7xl
        mx-auto
        grid
        md:grid-cols-4
        gap-10
      ">



        {/* Brand */}

        <div>

          <div className="
            flex
            items-center
            gap-3
          ">

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
                size={24}
                className="text-white"
              />

            </div>


            <h2 className="
              text-3xl
              font-black
            ">

              Swift
              <span className="text-blue-400">
                Ship
              </span>

            </h2>


          </div>



          <p className="
            text-gray-400
            mt-5
            leading-relaxed
          ">
            Modern logistics solutions built for speed,
            security, and reliability.
          </p>


        </div>





        {/* Company */}

        <div>

          <h3 className="
            font-bold
            text-xl
            mb-5
          ">
            Company
          </h3>


          <ul className="
            space-y-3
            text-gray-400
          ">

            {[
              "About",
              "Services",
              "Careers",
              "Contact"
            ].map(item=>(

              <li
                key={item}
                className="
                  hover:text-blue-400
                  cursor-pointer
                  transition
                "
              >
                {item}
              </li>

            ))}


          </ul>


        </div>





        {/* Services */}

        <div>

          <h3 className="
            font-bold
            text-xl
            mb-5
          ">
            Services
          </h3>


          <ul className="
            space-y-3
            text-gray-400
          ">


            {[
              "Express Delivery",
              "Business Shipping",
              "Tracking",
              "Worldwide Delivery"
            ].map(item=>(

              <li
                key={item}
                className="
                  hover:text-blue-400
                  cursor-pointer
                  transition
                "
              >
                {item}
              </li>

            ))}


          </ul>


        </div>





        {/* Contact */}

        <div>

          <h3 className="
            font-bold
            text-xl
            mb-5
          ">
            Contact
          </h3>



          <div className="
            space-y-4
            text-gray-400
          ">


            <p className="
              flex
              gap-3
              items-center
            ">

              <Mail
                size={20}
                className="text-blue-400"
              />

              support@swiftship.com

            </p>



            <p className="
              flex
              gap-3
              items-center
            ">

              <Phone
                size={20}
                className="text-blue-400"
              />

              +1 (800) 555-0199

            </p>



            <p className="
              flex
              gap-3
              items-center
            ">

              <MapPin
                size={20}
                className="text-blue-400"
              />

              United States

            </p>



          </div>


        </div>



      </div>





      <div className="
        relative
        max-w-7xl
        mx-auto
        mt-12
        pt-8
        border-t
        border-white/10
        text-gray-500
        text-center
      ">

        © 2026 SwiftShip. All rights reserved.

      </div>



    </footer>

  );

}


export default Footer;