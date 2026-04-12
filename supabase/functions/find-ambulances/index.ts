import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pinCode, lat, lng } = await req.json();

    if (!pinCode && (!lat || !lng)) {
      return new Response(
        JSON.stringify({ error: "Please provide a pin code or location coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
    if (!APIFY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let searchQuery = "ambulance service";
    if (pinCode) {
      searchQuery += ` in ${pinCode}, India`;
    } else if (lat && lng) {
      searchQuery += ` near ${lat},${lng}`;
    }

    console.log("Searching ambulances:", searchQuery);

    const actorRunResponse = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: [searchQuery],
          maxCrawledPlacesPerSearch: 8,
          language: "en",
          deeperCityScrape: false,
          skipClosedPlaces: false,
        }),
      }
    );

    if (!actorRunResponse.ok) {
      const errorText = await actorRunResponse.text();
      console.error("Apify API error:", actorRunResponse.status, errorText);
      throw new Error("Failed to fetch ambulance data");
    }

    const results = await actorRunResponse.json();
    console.log("Apify results count:", results?.length || 0);

    const ambulances = [];
    if (results && results.length > 0) {
      for (const place of results.slice(0, 8)) {
        let googleMapsLink = null;
        if (place.url && place.url.length > 0) {
          googleMapsLink = place.url;
        } else if (place.placeId) {
          googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title || place.name || "")}&query_place_id=${place.placeId}`;
        } else if (place.location?.lat && place.location?.lng) {
          googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`;
        } else if (place.address) {
          googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
        }

        ambulances.push({
          name: place.title || place.name || "Unknown",
          address: place.address || place.street || place.location?.address || "Address not available",
          phone: place.phone || place.phoneUnformatted || place.telephone || null,
          googleMapsLink,
          rating: place.totalScore || place.rating || null,
          reviewCount: place.reviewsCount || place.userRatingsTotal || null,
        });
      }
    }

    console.log(`Found ${ambulances.length} ambulance services`);

    return new Response(
      JSON.stringify({ ambulances }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in find-ambulances:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
