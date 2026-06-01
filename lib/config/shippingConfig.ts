// my-leather-platform/lib/shippingConfig.ts

// --- Shipping Costs and Country/Continent Map ---
// Backend-controlled rates for sample courier (DHL/FedEx/UPS) in USD cents.
// These figures cover door-to-door international courier with tracking and
// commercial-invoice handling. Adjust here only — never hardcode in the UI.
export const SHIPPING_COSTS_USD_CENTS: { [continent: string]: number } = {
  'United States': 5000,    // $50.00 — USA tier ($40–$60 band)
  'Canada': 4500,           // $45.00
  'United Kingdom': 4500,   // $45.00 — UK tier ($35–$55 band)
  'Europe': 4000,           // $40.00 — EU tier ($30–$50 band)
  'North America': 4500,    // fallback for unmapped North America
  'Asia': 3500,             // $35.00
  'Middle East': 3500,      // $35.00
  'South America': 5500,    // $55.00
  'Africa': 6000,           // $60.00
  'Oceania': 5000,          // $50.00
  'default': 5500           // $55.00 fallback for unmapped regions
};

export const COUNTRY_TO_CONTINENT_MAP: { [country: string]: string } = {
  'United States': 'United States',
  'Canada': 'Canada',
  'Mexico': 'North America',
  'United Kingdom': 'United Kingdom',
  'Ireland': 'Europe',
  'Germany': 'Europe',
  'France': 'Europe',
  'Italy': 'Europe',
  'Spain': 'Europe',
  'Netherlands': 'Europe',
  'Belgium': 'Europe',
  'Sweden': 'Europe',
  'Norway': 'Europe',
  'Denmark': 'Europe',
  'Finland': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'Poland': 'Europe',
  'Portugal': 'Europe',
  'Greece': 'Europe',
  'Czech Republic': 'Europe',
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'Japan': 'Asia',
  'China': 'Asia',
  'India': 'Asia',
  'South Korea': 'Asia',
  'Singapore': 'Asia',
  'Hong Kong': 'Asia',
  'Malaysia': 'Asia',
  'Thailand': 'Asia',
  'Vietnam': 'Asia',
  'Indonesia': 'Asia',
  'Philippines': 'Asia',
  'United Arab Emirates': 'Middle East',
  'Saudi Arabia': 'Middle East',
  'Qatar': 'Middle East',
  'Kuwait': 'Middle East',
  'Turkey': 'Middle East',
  'Israel': 'Middle East',
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'South Africa': 'Africa',
  'Nigeria': 'Africa',
  'Egypt': 'Africa',
  'Kenya': 'Africa',
  'Morocco': 'Africa',
  'Other': 'default'
};

// Export the countries array directly for use in frontend Select components
export const countries: string[] = Object.keys(COUNTRY_TO_CONTINENT_MAP).sort();

export function getShippingRegion(country: string): string {
  return COUNTRY_TO_CONTINENT_MAP[country] || 'default';
}

export function getShippingFeeInCents(country: string): number {
  const region = getShippingRegion(country);
  return SHIPPING_COSTS_USD_CENTS[region] || SHIPPING_COSTS_USD_CENTS['default'];
}

export function getShippingFeeInDollars(country: string): number {
  return getShippingFeeInCents(country) / 100;
}

export interface ShippingQuote {
  country: string;
  region: string;
  amount: number;        // dollars (e.g. 50)
  amountCents: number;   // cents (e.g. 5000)
  currency: 'USD';
  carriers: string[];    // recommended courier list
  estimatedDeliveryDays: { min: number; max: number };
}

function getEstimatedDelivery(region: string): { min: number; max: number } {
  switch (region) {
    case 'United States':
    case 'United Kingdom':
      return { min: 5, max: 7 };
    case 'Europe':
    case 'Canada':
    case 'North America':
      return { min: 5, max: 8 };
    case 'Asia':
    case 'Middle East':
    case 'Oceania':
      return { min: 6, max: 10 };
    default:
      return { min: 7, max: 12 };
  }
}

export function getShippingQuote(country: string): ShippingQuote {
  const region = getShippingRegion(country);
  const amountCents = getShippingFeeInCents(country);
  return {
    country,
    region,
    amount: amountCents / 100,
    amountCents,
    currency: 'USD',
    carriers: ['DHL', 'FedEx', 'UPS'],
    estimatedDeliveryDays: getEstimatedDelivery(region),
  };
}

// --- Form Options (Moved from app/sample-request/page.tsx for reusability) ---
// Define these types if you want to keep them centralized, otherwise ensure they are defined wherever used.
import {
  SampleRequestItemType, Urgency, BusinessType, IntendedUse, ExpectedVolume
} from '@/types/request'; // Assuming '@/types/request' defines these

export const sampleTypes: SampleRequestItemType[] = ['raw-leather', 'finished-products', 'both'];
export const quantities = ["1-3 samples", "4-6 samples", "7-10 samples", "More than 10"];
export const materialPreferences = ["Cowhide", "Buffalo", "Goat", "Sheep", "Mixed Selection", "Other"];
export const finishTypes = ["Aniline", "Semi-Aniline", "Pigmented", "Suede", "Mixed Selection", "Other"];
export const urgencies: Urgency[] = ["standard", "express", "rush"];
export const businessTypes: BusinessType[] = ['wholesaler', 'retailer', 'manufacturer', 'distributor', 'designer', 'other'];
export const intendedUses: IntendedUse[] = ['production', 'resale', 'testing', 'development', 'other'];
export const futureVolumes: ExpectedVolume[] = ['small', 'medium', 'large', 'ongoing', 'unsure'];