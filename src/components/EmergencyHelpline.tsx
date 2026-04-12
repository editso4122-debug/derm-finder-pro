import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Ambulance, Shield, Flame, Baby, Brain, Pill, Heart, MapPin, Loader2, Navigation, Search, Star, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface AmbulanceResult {
  name: string;
  address: string;
  phone: string | null;
  googleMapsLink: string | null;
  rating: number | null;
  reviewCount: number | null;
}

const EmergencyHelpline = () => {
  const [showFinder, setShowFinder] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [ambulances, setAmbulances] = useState<AmbulanceResult[]>([]);
  const [searched, setSearched] = useState(false);

  const searchAmbulances = async (params: { pinCode?: string; lat?: number; lng?: number }) => {
    setLoading(true);
    setSearched(true);
    setAmbulances([]);
    try {
      const { data, error } = await supabase.functions.invoke("find-ambulances", { body: params });
      if (error) throw error;
      setAmbulances(data?.ambulances || []);
      if (!data?.ambulances?.length) {
        toast.info("No ambulance services found in this area");
      }
    } catch (err) {
      toast.error("Failed to find ambulances. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSearch = () => {
    if (!/^\d{6}$/.test(pinCode)) {
      toast.error("Please enter a valid 6-digit pin code");
      return;
    }
    searchAmbulances({ pinCode });
  };

  const handleGpsSearch = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        searchAmbulances({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setGpsLoading(false);
        toast.error("Unable to get your location. Please use pin code instead.");
      },
      { timeout: 10000 }
    );
  };

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

        {/* Find Nearby Ambulances */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={() => setShowFinder(!showFinder)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-destructive text-destructive-foreground font-semibold text-lg rounded-2xl shadow-lg shadow-destructive/25"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px hsl(0 72% 50% / 0.4)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Ambulance className="w-6 h-6" />
            {showFinder ? "Hide Ambulance Finder" : "Find Nearby Ambulances"}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showFinder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-8 bg-secondary/60 backdrop-blur border border-primary/20 rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-destructive" />
                  Find Ambulances Near You
                </h3>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit pin code"
                      className="flex-1 bg-background border border-primary/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      onKeyDown={(e) => e.key === "Enter" && handlePinSearch()}
                    />
                    <motion.button
                      onClick={handlePinSearch}
                      disabled={loading}
                      className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Search className="w-4 h-4" />
                      Search
                    </motion.button>
                  </div>

                  <motion.button
                    onClick={handleGpsSearch}
                    disabled={loading || gpsLoading}
                    className="px-5 py-3 bg-accent text-accent-foreground rounded-xl font-medium flex items-center gap-2 justify-center disabled:opacity-50"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    Use My Location
                  </motion.button>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-muted-foreground">Finding nearby ambulances...</span>
                  </div>
                )}

                {!loading && searched && ambulances.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No ambulance services found. Try a different pin code or location.
                  </div>
                )}

                {ambulances.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ambulances.map((amb, index) => (
                      <motion.div
                        key={index}
                        className="bg-background/60 border border-primary/10 rounded-xl p-5 hover:border-primary/30 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-foreground text-sm leading-tight">{amb.name}</h4>
                          {amb.rating && (
                            <span className="flex items-center gap-1 text-xs text-yellow-400 shrink-0">
                              <Star className="w-3 h-3 fill-current" />
                              {amb.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{amb.address}</p>
                        <div className="flex flex-wrap gap-2">
                          {amb.phone && (
                            <a
                              href={`tel:${amb.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-medium rounded-lg hover:bg-destructive/20 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              {amb.phone}
                            </a>
                          )}
                          {amb.googleMapsLink && (
                            <a
                              href={amb.googleMapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open in Maps
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default EmergencyHelpline;
