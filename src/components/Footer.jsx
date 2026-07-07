import { Mail, Phone, MapPin } from "lucide-react";

function Footer() {
  return (
    <footer
      id="contact"
      className="
        bg-slate-950
        text-white
        border-t
        border-white/10
        px-8
        py-16
      "
    >

      <div className="
        max-w-7xl
        mx-auto
        grid
        md:grid-cols-4
        gap-10
      ">


        <div>

          <h2 className="
            text-3xl
            font-black
            text-blue-400
          ">
            SwiftShip
          </h2>

          <p className="
            text-gray-400
            mt-4
          ">
            Modern logistics solutions built for speed,
            security, and reliability.
          </p>

        </div>



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
            <li>About</li>
            <li>Services</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>

        </div>



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
            <li>Express Delivery</li>
            <li>Business Shipping</li>
            <li>Tracking</li>
            <li>Worldwide Delivery</li>
          </ul>

        </div>



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

            <p className="flex gap-3 items-center">
              <Mail size={20}/>
              support@swiftship.com
            </p>


            <p className="flex gap-3 items-center">
              <Phone size={20}/>
              +1 (800) 555-0199
            </p>


            <p className="flex gap-3 items-center">
              <MapPin size={20}/>
              United States
            </p>


          </div>

        </div>


      </div>


      <div className="
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