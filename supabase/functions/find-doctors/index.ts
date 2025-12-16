import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pinCode, city } = await req.json();

    if (!pinCode && !city) {
      return new Response(
        JSON.stringify({ error: "Please provide a pin code or city" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
    if (!APIFY_API_KEY) {
      console.error("APIFY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search query for dermatologists in India
    let searchQuery = "dermatologist";
    if (city) {
      searchQuery += ` in ${city}, India`;
    } else if (pinCode) {
      searchQuery += ` in ${pinCode}, India`;
    }

    console.log("Searching Apify Google Maps:", searchQuery);

    // Start Apify Google Maps Scraper actor
    const actorRunResponse = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchStringsArray: [searchQuery],
          maxCrawledPlacesPerSearch: 5,
          language: "en",
          deeperCityScrape: false,
          skipClosedPlaces: false,
        }),
      }
    );

    if (!actorRunResponse.ok) {
      const errorText = await actorRunResponse.text();
      console.error("Apify API error:", actorRunResponse.status, errorText);
      throw new Error("Failed to fetch from Apify");
    }

    const results = await actorRunResponse.json();
    console.log("Apify results count:", results?.length || 0);
    
    // Log first result to debug field names
    if (results && results.length > 0) {
      console.log("Sample result fields:", JSON.stringify(Object.keys(results[0])));
    }

    // Format the results
    const doctors = [];
    if (results && results.length > 0) {
      for (const place of results.slice(0, 5)) {
        // Construct Google Maps URL from placeId if url is empty
        let googleMapsLink = null;
        if (place.url && place.url.length > 0) {
          googleMapsLink = place.url;
        } else if (place.placeId) {
          googleMapsLink = `https://www.google.com/maps/place/?q=place_id:${place.placeId}`;
        } else if (place.location?.lat && place.location?.lng) {
          googleMapsLink = `https://www.google.com/maps?q=${place.location.lat},${place.location.lng}`;
        }
        
        doctors.push({
          name: place.title || place.name || "Unknown",
          specialty: "Dermatologist",
          address: place.address || place.street || place.location?.address || "Address not available",
          city: place.city || place.location?.city || city || "",
          phone: place.phone || place.phoneUnformatted || place.telephone || null,
          googleMapsLink: googleMapsLink,
          rating: place.totalScore || place.rating || place.stars || null,
          reviewCount: place.reviewsCount || place.reviews || place.userRatingsTotal || null,
          workingHours: place.openingHours || place.workHours || place.hours || null,
        });
      }
    }

    console.log(`Found ${doctors.length} dermatologists`);

    return new Response(
      JSON.stringify({ doctors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in find-doctors function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
