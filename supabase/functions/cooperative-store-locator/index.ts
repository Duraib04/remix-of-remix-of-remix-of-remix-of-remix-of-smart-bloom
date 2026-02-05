import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoreLocation {
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  state: string;
  pincode: string;
}

interface CooperativeStore {
  id: string;
  name: string;
  type: 'kootturam_sangam' | 'fcs' | 'cooperative' | 'agri_input_store';
  location: StoreLocation;
  contact: {
    phone: string;
    email: string;
    manager: string;
  };
  services: string[];
  products: string[];
  openingHours: {
    weekdays: string;
    weekend: string;
  };
  distance?: number;
}

// Sample cooperative stores data
const COOPERATIVE_STORES: CooperativeStore[] = [
  {
    id: "salem_ks",
    name: "Salem Kootturam Sangam",
    type: "kootturam_sangam",
    location: {
      latitude: 11.1371,
      longitude: 78.1441,
      address: "#45, Main Road, Salem Market, Salem",
      district: "Salem",
      state: "Tamil Nadu",
      pincode: "636001"
    },
    contact: {
      phone: "+91-427-2426262",
      email: "salem.ks@tamilnadu.gov.in",
      manager: "Kumar R."
    },
    services: ["Seed distribution", "Fertilizer supply", "Certification", "Training"],
    products: ["Rice seeds", "Groundnut seeds", "Cotton seeds", "Vegetables", "Fertilizers", "Pesticides"],
    openingHours: {
      weekdays: "9:00 AM - 5:00 PM",
      weekend: "9:00 AM - 1:00 PM"
    }
  },
  {
    id: "erode_ks",
    name: "Erode Kootturam Sangam",
    type: "kootturam_sangam",
    location: {
      latitude: 11.3410,
      longitude: 77.7172,
      address: "#12, Bazaar Street, Erode City",
      district: "Erode",
      state: "Tamil Nadu",
      pincode: "638001"
    },
    contact: {
      phone: "+91-424-2232626",
      email: "erode.ks@tamilnadu.gov.in",
      manager: "Prakash M."
    },
    services: ["Seed distribution", "Soil testing", "Consultation", "Certification"],
    products: ["Sugarcane seeds", "Maize seeds", "Pulses", "Fertilizers"],
    openingHours: {
      weekdays: "8:30 AM - 4:30 PM",
      weekend: "10:00 AM - 12:00 PM"
    }
  },
  {
    id: "namakkal_coop",
    name: "Namakkal Agricultural Cooperative",
    type: "cooperative",
    location: {
      latitude: 11.7268,
      longitude: 78.1643,
      address: "Cooperative Colony, Namakkal",
      district: "Namakkal",
      state: "Tamil Nadu",
      pincode: "637001"
    },
    contact: {
      phone: "+91-427-2422222",
      email: "namakkal.coop@tamilnadu.gov.in",
      manager: "Anandan G."
    },
    services: ["Seed supply", "Equipment rental", "Marketing", "Credit facility"],
    products: ["Vegetable seeds", "Flower seeds", "Fertilizers", "Pesticides"],
    openingHours: {
      weekdays: "9:00 AM - 5:00 PM",
      weekend: "Closed"
    }
  },
  {
    id: "hyderabad_agri",
    name: "Hyderabad Agricultural Cooperative",
    type: "fcs",
    location: {
      latitude: 17.3850,
      longitude: 78.4867,
      address: "#56, Kukatpally, Hyderabad",
      district: "Hyderabad",
      state: "Andhra Pradesh",
      pincode: "500072"
    },
    contact: {
      phone: "+91-40-23230123",
      email: "hyderabad.agri@ap.gov.in",
      manager: "Reddy V."
    },
    services: ["Input distribution", "Extension training", "Market linkage"],
    products: ["Cotton seeds", "Rice seeds", "Soybean", "Fertilizers"],
    openingHours: {
      weekdays: "9:00 AM - 5:00 PM",
      weekend: "10:00 AM - 2:00 PM"
    }
  },
  {
    id: "vijayawada_fcs",
    name: "Vijayawada Farm Cooperative Society",
    type: "fcs",
    location: {
      latitude: 16.5062,
      longitude: 80.6480,
      address: "#23, Governorpet, Vijayawada",
      district: "Krishna",
      state: "Andhra Pradesh",
      pincode: "520002"
    },
    contact: {
      phone: "+91-866-2543210",
      email: "vijayawada.fcs@ap.gov.in",
      manager: "Krishna P."
    },
    services: ["Seed certification", "Pesticide supply", "Consultation"],
    products: ["Sugarcane seeds", "Mango saplings", "Coconut plants", "Fertilizers"],
    openingHours: {
      weekdays: "8:00 AM - 6:00 PM",
      weekend: "8:00 AM - 1:00 PM"
    }
  }
];

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radiusKm = 50, type = 'all' } = await req.json();

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate distances and filter
    const nearbyStores = COOPERATIVE_STORES
      .map(store => ({
        ...store,
        distance: calculateDistance(latitude, longitude, store.location.latitude, store.location.longitude)
      }))
      .filter(store => store.distance <= radiusKm && (type === 'all' || store.type === type))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    return new Response(
      JSON.stringify({
        count: nearbyStores.length,
        stores: nearbyStores,
        searchRadius: radiusKm,
        userLocation: { latitude, longitude }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stores' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
