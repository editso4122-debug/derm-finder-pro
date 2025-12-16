import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Phone, Building2, Loader2, Star, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Doctor {
  name: string;
  specialty: string;
  address: string;
  city: string;
  phone: string | null;
  googleMapsLink: string | null;
  rating: number | null;
  reviewCount: number | null;
  workingHours: string[] | null;
}

const DoctorFinder = () => {
  const [pinCode, setPinCode] = useState("");
  const [city, setCity] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const searchDoctors = async () => {
    if (!pinCode && !city) {
      toast({
        title: "Location required",
        description: "Please enter a pin code or city name.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('find-doctors', {
        body: { pinCode, city }
      });

      if (error) {
        throw new Error(error.message || "Failed to search for doctors");
      }

      if (data.doctors && data.doctors.length > 0) {
        setDoctors(data.doctors);
        toast({
          title: "Doctors Found",
          description: `Found ${data.doctors.length} dermatologists in your area.`,
        });
      } else {
        setDoctors([]);
        toast({
          title: "No Results",
          description: "No dermatologists found in this area. Try a different location.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Unable to search for doctors. Please try again.",
        variant: "destructive",
      });
      setDoctors([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatWorkingHours = (hours: string[] | null) => {
    if (!hours || hours.length === 0) return null;
    return hours.slice(0, 2).join(", ");
  };

  return (
    <section id="doctors" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Find a <span className="text-primary">Dermatologist</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Search for dermatologists near you in India
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mb-12"
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pin Code</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit pin code"
                      className="pl-10 bg-secondary/50 border-border/50"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Indian pin codes (6 digits)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city name"
                      className="pl-10 bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={searchDoctors}
                disabled={isSearching || (!pinCode && !city)}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Find Dermatologists
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {doctors.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {doctors.map((doctor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors h-full">
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-display font-semibold text-lg line-clamp-2">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-primary">{doctor.specialty}</p>
                        </div>

                        {/* Rating */}
                        {doctor.rating && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{doctor.rating.toFixed(1)}</span>
                            </div>
                            {doctor.reviewCount && (
                              <span className="text-sm text-muted-foreground">
                                ({doctor.reviewCount} reviews)
                              </span>
                            )}
                          </div>
                        )}

                        <div className="space-y-2 text-sm text-muted-foreground">
                          {/* Address */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              {doctor.address}
                              {doctor.city && `, ${doctor.city}`}
                            </span>
                          </div>

                          {/* Phone */}
                          {doctor.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              <span>{doctor.phone}</span>
                            </div>
                          )}

                          {/* Working Hours */}
                          {doctor.workingHours && doctor.workingHours.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">
                                {formatWorkingHours(doctor.workingHours)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Google Maps Button */}
                        {doctor.googleMapsLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => window.open(doctor.googleMapsLink!, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Get Location
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : hasSearched && !isSearching ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Doctors Found</h3>
              <p className="text-muted-foreground text-sm">
                Try searching with a different pin code or city name in India
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DoctorFinder;
