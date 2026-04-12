import { motion } from "framer-motion";
import { Phone, Ambulance, Shield, Flame, Baby, Brain, Pill, Heart } from "lucide-react";

const helplines = [
  { name: "Emergency (All)", number: "112", icon: Phone, color: "text-red-400", description: "National Emergency Number" },
  { name: "Ambulance", number: "102", icon: Ambulance, color: "text-primary", description: "Medical Emergency" },
  { name: "Police", number: "100", icon: Shield, color: "text-blue-400", description: "Law Enforcement" },
  { name: "Fire Brigade", number: "101", icon: Flame, color: "text-orange-400", description: "Fire Emergency" },
  { name: "Women Helpline", number: "181", icon: Heart, color: "text-pink-400", description: "Women in Distress" },
  { name: "Child Helpline", number: "1098", icon: Baby, color: "text-yellow-400", description: "Child Abuse / Missing" },
  { name: "Mental Health", number: "08046110007", icon: Brain, color: "text-purple-400", description: "iCall Counselling" },
  { name: "Poison Control", number: "1800-11-6117", icon: Pill, color: "text-green-400", description: "Poison Information" },
];

const EmergencyHelpline = () => {
  return (
    <section id="emergency" className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-full mb-4">
            <Phone className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Emergency Contacts</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Emergency Helpline Directory
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Save these numbers — they could save a life. Tap any card to call directly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {helplines.map((item, index) => (
            <motion.a
              key={item.number}
              href={`tel:${item.number}`}
              className="group relative bg-secondary/60 backdrop-blur border border-primary/10 rounded-2xl p-5 flex flex-col items-center text-center hover:border-primary/40 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className={`p-3 rounded-xl bg-secondary mb-3 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{item.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
              <span className="text-lg font-bold text-primary tracking-wide">{item.number}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EmergencyHelpline;
