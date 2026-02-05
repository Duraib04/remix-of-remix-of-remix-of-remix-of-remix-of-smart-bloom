import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GovernmentScheme {
  id: string;
  name: string;
  ministry: string;
  state: string[];
  category: 'subsidy' | 'loan' | 'insurance' | 'infrastructure' | 'training' | 'marketing';
  description: string;
  eligibility: {
    landHolding: string;
    annualIncome?: string;
    age?: string;
    others?: string[];
  };
  benefits: {
    title: string;
    amount: string;
  }[];
  applicationProcess: {
    step: number;
    description: string;
    documents?: string[];
  }[];
  requiredDocuments: string[];
  website: string;
  helpline: string;
  applyOnline: string;
  applyOffline: {
    department: string;
    address: string;
    contact: string;
  };
  lastUpdated: string;
}

const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: "pm_kisan",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    state: ["National"],
    category: "subsidy",
    description: "Direct income support scheme providing ₹6,000 per year to all farmers in three installments",
    eligibility: {
      landHolding: "All landholding farmers",
      age: "No age restriction",
      others: ["Must be Indian citizen", "Must be farmer/cultivator of land"]
    },
    benefits: [
      { title: "Direct income support", amount: "₹6,000 per year (₹2,000 per installment)" },
      { title: "Total benefit", amount: "₹2,000 × 3 installments per year" }
    ],
    applicationProcess: [
      { step: 1, description: "Visit https://pmkisan.gov.in or go to nearest Gram Panchayat", documents: [] },
      { step: 2, description: "Click 'Register' or 'Login' with Aadhar/Account Number", documents: [] },
      { step: 3, description: "Fill in land and personal details", documents: ["Land documents", "Aadhar Card", "Bank account details"] },
      { step: 4, description: "Submit application and save confirmation number", documents: [] }
    ],
    requiredDocuments: ["Aadhar Card", "Bank Account Details", "Land Ownership Proof/Patta", "10-digit Mobile Number"],
    website: "https://pmkisan.gov.in",
    helpline: "1800-115-526",
    applyOnline: "https://pmkisan.gov.in",
    applyOffline: {
      department: "Gram Panchayat or Revenue Circle Office",
      address: "Block Development Officer (BDO) or Taluk Office",
      contact: "Contact local gram panchayat"
    },
    lastUpdated: "2026-01-15"
  },
  {
    id: "pm_fasal_bima",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    state: ["National"],
    category: "insurance",
    description: "Crop insurance scheme protecting farmers from yield loss due to natural calamities",
    eligibility: {
      landHolding: "All farmers including tenant farmers",
      others: ["Must be cultivating insurable crop in notified area"]
    },
    benefits: [
      { title: "Sum insured (Kharif)", amount: "Up to ₹1,00,000 per hectare" },
      { title: "Sum insured (Rabi)", amount: "Up to ₹1,50,000 per hectare" },
      { title: "Farmer contribution", amount: "1.5-5% of sum insured" },
      { title: "Government subsidy", amount: "Up to 90% of premium" }
    ],
    applicationProcess: [
      { step: 1, description: "Registration at agriculture office or bank", documents: ["Land documents", "Aadhar", "Bank account"] },
      { step: 2, description: "Pay premium amount", documents: [] },
      { step: 3, description: "Notification of crop damage to field staff", documents: [] },
      { step: 4, description: "Claim assessment and settlement", documents: ["Damage report"] }
    ],
    requiredDocuments: ["Aadhar Card", "Land ownership proof", "Bank account details", "Seed receipt"],
    website: "https://pmfby.gov.in",
    helpline: "1800-180-1551",
    applyOnline: "https://pmfby.gov.in",
    applyOffline: {
      department: "District Agriculture Office or Bank",
      address: "Block level agriculture center",
      contact: "Contact nearest agricultural office"
    },
    lastUpdated: "2026-01-10"
  },
  {
    id: "tn_rytu_bharosai",
    name: "Rythu Bharosa Scheme (Tamil Nadu)",
    ministry: "Tamil Nadu Department of Agriculture",
    state: ["Tamil Nadu"],
    category: "subsidy",
    description: "Direct cash transfer to farmers for crop cultivation",
    eligibility: {
      landHolding: "Up to 5 acres",
      others: ["Cultivators of declared crops"]
    },
    benefits: [
      { title: "Annual cash support", amount: "₹1,000 per acre per crop" },
      { title: "Maximum benefit", amount: "₹5,000 per acre per year" }
    ],
    applicationProcess: [
      { step: 1, description: "Register at village revenue office", documents: ["Patta", "Aadhar", "Bank details"] },
      { step: 2, description: "Verification of land and cultivation", documents: [] },
      { step: 3, description: "Direct transfer to bank account", documents: [] }
    ],
    requiredDocuments: ["Patta", "Aadhar Card", "Bank account details"],
    website: "https://www.tn.gov.in",
    helpline: "1800-425-1969",
    applyOnline: "https://www.tn.gov.in/agriculture",
    applyOffline: {
      department: "Village Revenue Office",
      address: "Block / Taluk headquarters",
      contact: "Contact local taluk office"
    },
    lastUpdated: "2026-01-05"
  },
  {
    id: "ap_rytu_bandhu",
    name: "Rytu Bandhu (Andhra Pradesh)",
    ministry: "AP Department of Agriculture",
    state: ["Andhra Pradesh"],
    category: "subsidy",
    description: "Financial assistance to farmers for every crop they cultivate",
    eligibility: {
      landHolding: "All farmers",
      others: ["Should have at least 0.1 acre of land"]
    },
    benefits: [
      { title: "Financial assistance", amount: "₹5,000 per acre per crop season" },
      { title: "Two crops per year", amount: "Up to ₹10,000 per acre per year" }
    ],
    applicationProcess: [
      { step: 1, description: "Register on mAGRICULTURE AP portal", documents: ["Survey number", "Aadhar", "Bank account"] },
      { step: 2, description: "Submit land and bank details", documents: [] },
      { step: 3, description: "Verification by agriculture officers", documents: [] },
      { step: 4, description: "Money credited to bank account every 15 days", documents: [] }
    ],
    requiredDocuments: ["Survey number / RTC", "Aadhar Card", "Bank account details"],
    website: "https://www.agriculture.ap.gov.in",
    helpline: "1902",
    applyOnline: "https://maagriculture.ap.gov.in",
    applyOffline: {
      department: "Mandal Revenue Office",
      address: "Mandal headquarters",
      contact: "Contact mandal agriculture officer"
    },
    lastUpdated: "2026-01-08"
  },
  {
    id: "pradhan_mantri_krishi_sinchayee",
    name: "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    state: ["National"],
    category: "infrastructure",
    description: "Subsidy scheme for irrigation infrastructure with 50-75% government support",
    eligibility: {
      landHolding: "Minimum 0.5 acre",
      others: ["Land should have no irrigation or unreliable irrigation"]
    },
    benefits: [
      { title: "Subsidy for micro irrigation", amount: "40-55% of cost" },
      { title: "Subsidy for wells", amount: "50-60% of cost" },
      { title: "Subsidy for pipe networks", amount: "40-55% of cost" }
    ],
    applicationProcess: [
      { step: 1, description: "Expression of Interest at village level", documents: [] },
      { step: 2, description: "Technical survey and project formulation", documents: ["Land documents", "Patta"] },
      { step: 3, description: "Approval and sanction", documents: [] },
      { step: 4, description: "Implementation and payment of subsidy", documents: [] }
    ],
    requiredDocuments: ["Land ownership proof", "Aadhar Card", "Bank account details"],
    website: "https://pmksy.gov.in",
    helpline: "1800-180-1551",
    applyOnline: "https://pmksy.gov.in",
    applyOffline: {
      department: "District / Block PMKSY Office",
      address: "Agriculture Department office",
      contact: "Contact district PMKSY nodal officer"
    },
    lastUpdated: "2026-01-12"
  },
  {
    id: "dbt_scheme",
    name: "Direct Benefit Transfer (DBT) for Agricultural Input",
    ministry: "Ministry of Agriculture",
    state: ["National"],
    category: "subsidy",
    description: "Direct electronic transfer of subsidy for seeds, fertilizers, and pesticides",
    eligibility: {
      landHolding: "All farmers",
      others: ["Should have valid bank account"]
    },
    benefits: [
      { title: "Seed subsidy", amount: "50-75% of seed cost" },
      { title: "Fertilizer subsidy", amount: "50-80% depending on type" },
      { title: "Pesticide subsidy", amount: "40-60% of cost" }
    ],
    applicationProcess: [
      { step: 1, description: "Register at agriculture office", documents: ["Aadhar", "Bank account"] },
      { step: 2, description: "Purchase from authorized dealer", documents: ["Receipt from authorized dealer"] },
      { step: 3, description: "Submit receipt to agriculture officer", documents: ["Input receipt", "ID proof"] },
      { step: 4, description: "Subsidy credited to bank account", documents: [] }
    ],
    requiredDocuments: ["Aadhar Card", "Bank account details", "Land ownership proof"],
    website: "https://agrigovernance.gov.in",
    helpline: "1800-425-1969",
    applyOnline: "https://agrigovernance.gov.in",
    applyOffline: {
      department: "Block Agriculture Office",
      address: "Agriculture Extension Center",
      contact: "Contact block agriculture officer"
    },
    lastUpdated: "2026-01-14"
  }
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { state = 'Tamil Nadu', category = 'all' } = await req.json();

    let schemes = GOVERNMENT_SCHEMES.filter(scheme => {
      const stateMatch = scheme.state.includes('National') || scheme.state.includes(state);
      const categoryMatch = category === 'all' || scheme.category === category;
      return stateMatch && categoryMatch;
    });

    const schemesByCategory = schemes.reduce((acc: any, scheme) => {
      if (!acc[scheme.category]) {
        acc[scheme.category] = [];
      }
      acc[scheme.category].push(scheme);
      return acc;
    }, {});

    return new Response(
      JSON.stringify({
        state,
        totalSchemes: schemes.length,
        schemesByCategory,
        allSchemes: schemes,
        categories: Object.keys(schemesByCategory)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch schemes' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
