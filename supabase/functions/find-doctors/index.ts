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
    const { zipCode, city } = await req.json();

    if (!zipCode && !city) {
      return new Response(
        JSON.stringify({ error: "Please provide a zip code or city" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build NPI Registry API URL
    const params = new URLSearchParams({
      version: "2.1",
      enumeration_type: "NPI-1", // Individual providers
      taxonomy_description: "Dermatology",
      limit: "10",
    });

    if (zipCode) {
      // Take first 5 digits for US zip codes, or use as-is for others
      params.append("postal_code", zipCode.substring(0, 5));
    }
    if (city) {
      params.append("city", city);
    }

    console.log("Searching NPI Registry:", params.toString());

    const response = await fetch(
      `https://npiregistry.cms.hhs.gov/api/?${params.toString()}`
    );

    if (!response.ok) {
      console.error("NPI API error:", response.status);
      throw new Error("Failed to fetch from NPI Registry");
    }

    const data = await response.json();
    
    // Format the results
    const doctors = [];
    if (data.results && data.results.length > 0) {
      for (const result of data.results) {
        const basic = result.basic || {};
        const address = result.addresses?.find((a: any) => a.address_purpose === "LOCATION") || 
                       result.addresses?.[0] || {};
        
        const firstName = basic.first_name || "";
        const lastName = basic.last_name || "";
        const credential = basic.credential || "";
        
        doctors.push({
          name: `Dr. ${firstName} ${lastName}${credential ? `, ${credential}` : ""}`,
          specialty: result.taxonomies?.[0]?.desc || "Dermatology",
          address: address.address_1 || "Address not available",
          city: address.city || "",
          state: address.state || "",
          zip: address.postal_code?.substring(0, 5) || "",
          phone: address.telephone_number || "Not available",
        });
      }
    }

    console.log(`Found ${doctors.length} doctors`);

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