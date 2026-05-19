export interface Programme {
  id: string | number;
  name: string;
  description: string;
  price: number;
  status: "active" | "inactive";
  image?: string;
  maxConcurrentBookings?: number;
  maxBookingsPerDay?: number;
  steps: Array<{
    id: string | number;
    title: string;
    description: string;
    duration: string;
  }>;
  totalDuration?: string;
  translations?: Array<{
    languageCode: string;
    name: string;
    description: string;
  }>;
  media?: Array<{
    id: string;
    url: string;
  }>;
}
