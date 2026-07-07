import { motion } from "framer-motion";
import {
  Truck,
  PackageCheck,
  Globe,
} from "lucide-react";

const services = [
  {
    icon: Truck,
    title: "Express Delivery",
    description:
      "Fast nationwide delivery with real-time tracking.",
  },
  {
    icon: PackageCheck,
    title: "Secure Shipping",
    description:
      "Every parcel is handled with maximum safety.",
  },
  {
    icon: Globe,
    title: "International",
    description:
      "Worldwide logistics with trusted partners.",
  },
];

function Services() {
  return (
    <section className="bg-slate-900 text-white py-28 px-8">
      <div className="max-w-7xl mx-auto">

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-5xl font-bold text-center mb-16"
        >
          Our Services
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;

            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.2,
                  duration: 0.7,
                }}
                whileHover={{
                  y: -10,
                  scale: 1.03,
                }}
                className="rounded-3xl bg-slate-800 p-8 border border-white/10 shadow-xl"
              >
                <Icon className="text-blue-400 mb-6" size={48} />

                <h3 className="text-2xl font-bold mb-4">
                  {service.title}
                </h3>

                <p className="text-gray-400">
                  {service.description}
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