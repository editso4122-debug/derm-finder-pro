import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Phone, Building2, Loader2, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  name: string;
  specialty: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

const DoctorFinder = () => {
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const searchDoctors = async () => {
    if (!zipCode && !city) {
      toast({
        title: "Location required",
        description: "Please enter a zip code or city name.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Using the free NPI (National Provider Identifier) Registry API
      // This is a free, official US government API - no API key required
      const params = new URLSearchParams({
        version: "2.1",
        enumeration_type: "NPI-1", // Individual providers
        taxonomy_description: "Dermatology",
        limit: "10",
      });

      if (zipCode) {
        params.append("postal_code", zipCode.substring(0, 5));
      }
      if (city) {
        params.append("city", city);
      }

      const response = await fetch(
        `https://npiregistry.cms.hhs.gov/api/?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to search for doctors");
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const formattedDoctors: Doctor[] = data.results.map((result: any) => {
          const basic = result.basic || {};
          const address = result.addresses?.find((a: any) => a.address_purpose === "LOCATION") || 
                         result.addresses?.[0] || {};
          
          const firstName = basic.first_name || "";
          const lastName = basic.last_name || "";
          const credential = basic.credential || "";
          
          return {
            name: `Dr. ${firstName} ${lastName}${credential ? `, ${credential}` : ""}`,
            specialty: result.taxonomies?.[0]?.desc || "Dermatology",
            address: address.address_1 || "Address not available",
            city: address.city || "",
            state: address.state || "",
            zip: address.postal_code?.substring(0, 5) || "",
            phone: address.telephone_number || "Not available",
          };
        });

        setDoctors(formattedDoctors);
        toast({
          title: "Doctors Found",
          description: `Found ${formattedDoctors.length} dermatologists in your area.`,
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

  const formatPhone = (phone: string) => {
    if (!phone || phone === "Not available") return phone;
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
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
            Search for board-certified dermatologists near you using the official NPI Registry
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
                  <label className="block text-sm font-medium mb-2">Zip Code</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="Enter zip code"
                      className="pl-10 bg-secondary/50 border-border/50"
                      maxLength={5}
                    />
                  </div>
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
                disabled={isSearching || (!zipCode && !city)}
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
              className="grid md:grid-cols-2 gap-4"
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
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-lg truncate">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-primary mb-3">{doctor.specialty}</p>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>
                                {doctor.address}
                                <br />
                                {doctor.city}, {doctor.state} {doctor.zip}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              <span>{formatPhone(doctor.phone)}</span>
                            </div>
                          </div>
                        </div>
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
                Try searching with a different zip code or city name
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DoctorFinder;