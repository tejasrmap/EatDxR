import { Restaurant } from "../types";

export interface GlobalRestaurant extends Restaurant {
  country: string;
  signatureDishes?: string[];
  tags?: string[];
  openingHours?: string;
  phone?: string;
  website?: string;
}

export const GLOBAL_CITIES = [
  // Global Food Capitals
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, region: "Global" },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.0060, region: "Global" },
  { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, region: "Global" },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, region: "Global" },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, region: "Global" },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, region: "Global" },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, region: "Global" },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, region: "Global" },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, region: "Global" },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, region: "Global" },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780, region: "Global" },
  
  // Indian Gastronomic Epicenters
  { name: "Hyderabad", country: "India", lat: 17.3850, lng: 78.4867, region: "India" },
  { name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946, region: "India" },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, region: "India" },
  { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025, region: "India" },
  { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707, region: "India" },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639, region: "India" },
  { name: "Goa", country: "India", lat: 15.2993, lng: 74.1240, region: "India" },
  { name: "Pune", country: "India", lat: 18.5204, lng: 73.8567, region: "India" },
  { name: "Amaravati (SRMAP)", country: "India", lat: 16.4819, lng: 80.5050, region: "India" }
];

export const GLOBAL_RESTAURANTS: GlobalRestaurant[] = [
  // ==========================================
  // HYDERABAD, INDIA
  // ==========================================
  {
    id: "bawarchi-rtc-hyd",
    name: "Bawarchi Restaurant",
    cuisine: "Hyderabadi Biryani & Mughlai",
    location: "RTC X Roads, Chikkadpally, Hyderabad",
    city: "Hyderabad",
    country: "India",
    lat: 17.4042,
    lng: 78.4983,
    rating: 4.9,
    reviewCount: 4210,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Chicken Dum Biryani", "Mutton Biryani", "Mirchi Ka Salan", "Tangdi Kebab"],
    tags: ["Legendary", "Biryani Capital", "Late Night", "Spicy"]
  },
  {
    id: "shadab-oldcity-hyd",
    name: "Hotel Shadab",
    cuisine: "Nizam Hyderabadi & Mughlai",
    location: "High Court Road, Ghansi Bazaar, Old City, Hyderabad",
    city: "Hyderabad",
    country: "India",
    lat: 17.3688,
    lng: 78.4735,
    rating: 4.8,
    reviewCount: 3890,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Mutton Biryani", "Bheja Fry", "Nihari Kulcha", "Double Ka Meetha"],
    tags: ["Heritage", "Old City", "Nizam Recipes", "Iconic"]
  },
  {
    id: "pista-house-charminar",
    name: "Pista House",
    cuisine: "Hyderabadi Haleem & Sweets",
    location: "Shalibanda Road, Charminar, Hyderabad",
    city: "Hyderabad",
    country: "India",
    lat: 17.3592,
    lng: 78.4747,
    rating: 4.9,
    reviewCount: 5120,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Royal Mutton Haleem", "Zafrani Chai", "Osmania Biscuits", "Kaddu Ki Kheer"],
    tags: ["GI-Tagged Haleem", "World Renowned", "Midnight Chai"]
  },
  {
    id: "chutneys-banjara-hyd",
    name: "Chutneys",
    cuisine: "South Indian Gourmet Breakfast",
    location: "Road No. 3, Banjara Hills, Hyderabad",
    city: "Hyderabad",
    country: "India",
    lat: 17.4239,
    lng: 78.4483,
    rating: 4.7,
    reviewCount: 2980,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Steam Dosa with 6 Chutneys", "Guntur Idli", "Babai Hotel Idli", "Filter Coffee"],
    tags: ["Pure Veg", "6 Chutney Platter", "Breakfast Benchmark"]
  },
  {
    id: "ulavacharu-jubilee-hyd",
    name: "Ulavacharu",
    cuisine: "Traditional Andhra & Coastal Rayalaseema",
    location: "Road No. 36, Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    country: "India",
    lat: 17.4319,
    lng: 78.4075,
    rating: 4.8,
    reviewCount: 2450,
    priceLevel: "₹₹₹",
    image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Ulavacharu Biryani", "Raju Gari Kodi Pulao", "Gongura Mutton", "Royyala Vepudu"],
    tags: ["Fiery Andhra", "Clay Pot Delicacies", "Cult Classic"]
  },

  // ==========================================
  // BANGALORE, INDIA
  // ==========================================
  {
    id: "rameshwaram-cafe-blr",
    name: "The Rameshwaram Cafe",
    cuisine: "Pure Desi Ghee South Indian",
    location: "100 Feet Road, HAL 2nd Stage, Indiranagar, Bangalore",
    city: "Bangalore",
    country: "India",
    lat: 12.9719,
    lng: 77.6412,
    rating: 4.9,
    reviewCount: 6890,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Ghee Podi Roast Dosa", "Open Butter Masala Dosa", "Ghee Podi Idli", "Filter Kaapi"],
    tags: ["High Velocity", "Desi Ghee", "Iconic Crunch", "Always Packed"]
  },
  {
    id: "brahmins-coffee-blr",
    name: "Brahmin's Coffee Bar",
    cuisine: "Heritage Kannada Tiffin",
    location: "Near Shankar Math, Ranga Rao Road, Shankarapura, Bangalore",
    city: "Bangalore",
    country: "India",
    lat: 12.9469,
    lng: 77.5684,
    rating: 4.9,
    reviewCount: 7420,
    priceLevel: "₹",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Soft Idli Vada Combo", "Free-Flow Coconut Chutney", "Khara Bath", "Filter Coffee"],
    tags: ["Legendary Heritage", "Standing Only", "Since 1965"]
  },
  {
    id: "meghana-foods-blr",
    name: "Meghana Foods",
    cuisine: "Andhra Special Biryani",
    location: "Residency Road, Ashok Nagar, Bangalore",
    city: "Bangalore",
    country: "India",
    lat: 12.9734,
    lng: 77.6080,
    rating: 4.8,
    reviewCount: 5640,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Meghana Special Chicken Biryani", "Boneless Chicken 65 Biryani", "Paneer Biryani", "Chilli Chicken"],
    tags: ["Cult Favorite", "Extra Masala Rice", "Student Staple"]
  },
  {
    id: "ctr-shri-sagar-blr",
    name: "CTR (Central Tiffin Room) / Shri Sagar",
    cuisine: "Crispy Benne Dosa & Tiffin",
    location: "7th Cross, Margosa Road, Malleshwaram, Bangalore",
    city: "Bangalore",
    country: "India",
    lat: 13.0031,
    lng: 77.5714,
    rating: 4.8,
    reviewCount: 4900,
    priceLevel: "₹",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Benne Masala Dosa", "Mangalore Bajji", "Poori Sagu", "Filter Kaapi"],
    tags: ["Crisp Golden Crust", "Malleshwaram Heritage", "Since 1950s"]
  },

  // ==========================================
  // MUMBAI, INDIA
  // ==========================================
  {
    id: "trishna-mumbai",
    name: "Trishna Restaurant",
    cuisine: "Coastal Mangalorean & Konkan Seafood",
    location: "Sai Baba Marg, Kala Ghoda, Fort, Mumbai",
    city: "Mumbai",
    country: "India",
    lat: 18.9284,
    lng: 72.8331,
    rating: 4.9,
    reviewCount: 3820,
    priceLevel: "₹₹₹",
    image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Butter Pepper Garlic King Crab", "Koliwada Prawns", "Neer Dosa", "Surmai Fry"],
    tags: ["World Renowned Seafood", "Celebrity Favorite", "Historic Kala Ghoda"]
  },
  {
    id: "subko-coffee-mumbai",
    name: "Subko Specialty Coffee & Craftery",
    cuisine: "Third-Wave Coffee & Artisanal Bakehouse",
    location: "Chapel Road, Bandra West, Mumbai",
    city: "Mumbai",
    country: "India",
    lat: 19.0526,
    lng: 72.8296,
    rating: 4.8,
    reviewCount: 2750,
    priceLevel: "₹₹₹",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Single Origin Pour-over", "Sourdough Toast & Podi Butter", "Pod-to-Bar Chocolate", "Bloom Cold Brew"],
    tags: ["Micro-Lot Roasts", "Artisan Bakery", "Bandra Vibes"]
  },
  {
    id: "bademiya-mumbai",
    name: "Bademiya",
    cuisine: "Late Night Mughlai & Charcoal Kebabs",
    location: "Tulloch Road, Apollo Bunder, Colaba, Mumbai",
    city: "Mumbai",
    country: "India",
    lat: 18.9218,
    lng: 72.8329,
    rating: 4.6,
    reviewCount: 6100,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Seekh Kebab Roll", "Chicken Baida Roti", "Mutton Boti Kebab", "Rumali Roti"],
    tags: ["Midnight Street Dining", "Behind Taj Mahal Hotel", "Charcoal Grill"]
  },
  {
    id: "britannia-co-mumbai",
    name: "Britannia & Co. Restaurant",
    cuisine: "Heritage Parsi & Irani Cafe",
    location: "Wakefield House, Ballard Estate, Fort, Mumbai",
    city: "Mumbai",
    country: "India",
    lat: 18.9348,
    lng: 72.8398,
    rating: 4.7,
    reviewCount: 3400,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Berry Pulao", "Mutton Dhansak", "Caramel Custard", "Sali Boti"],
    tags: ["Parsi Heritage", "Ballard Estate Colonial", "Historic 1923"]
  },

  // ==========================================
  // DELHI, INDIA
  // ==========================================
  {
    id: "karims-jama-delhi",
    name: "Karim's Historic Old Delhi",
    cuisine: "Royal Mughlai & Tandoor",
    location: "Gali Kababian, Jama Masjid, Old Delhi",
    city: "Delhi",
    country: "India",
    lat: 28.6507,
    lng: 77.2334,
    rating: 4.8,
    reviewCount: 7800,
    priceLevel: "₹₹",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Mutton Korma", "Mutton Burra Kebab", "Chicken Jahangiri", "Khamiri Roti"],
    tags: ["Mughal Royal lineage", "Established 1913", "Old Delhi Landmark"]
  },
  {
    id: "bukhara-itc-delhi",
    name: "Bukhara - ITC Maurya",
    cuisine: "North-West Frontier & Charcoal Tandoor",
    location: "Diplomatic Enclave, Chanakyapuri, New Delhi",
    city: "Delhi",
    country: "India",
    lat: 28.5975,
    lng: 77.1722,
    rating: 4.9,
    reviewCount: 3950,
    priceLevel: "₹₹₹₹",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Dal Bukhara (Simmered 18 Hours)", "Sikandari Raan", "Jumbo Prawn Tandoori", "Naan Bukhara"],
    tags: ["Global Top 50", "World Leaders Preferred", "Michelin-Grade"]
  },
  {
    id: "gulati-pandara-delhi",
    name: "Gulati Restaurant",
    cuisine: "North Indian & Butter Chicken",
    location: "6, Pandara Road Market, New Delhi",
    city: "Delhi",
    country: "India",
    lat: 28.6083,
    lng: 77.2346,
    rating: 4.8,
    reviewCount: 5200,
    priceLevel: "₹₹₹",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Velvety Butter Chicken", "Dal Makhani", "Kakori Kebab", "Garlic Naan"],
    tags: ["Pandara Benchmark", "Rich Gravies", "Late Night Delhi"]
  },

  // ==========================================
  // TOKYO, JAPAN
  // ==========================================
  {
    id: "sukiyabashi-jiro-tokyo",
    name: "Sukiyabashi Jiro",
    cuisine: "Edomae Omakase Sushi",
    location: "Tsukamoto Sozan Bldg, 4-2-15 Ginza, Chuo-ku, Tokyo",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6722,
    lng: 139.7644,
    rating: 5.0,
    reviewCount: 3100,
    priceLevel: "¥¥¥¥",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Otoro Nigiri", "Uni from Hokkaido", "Kohada (Gizzard Shad)", "Tamagoyaki"],
    tags: ["3-Star Michelin Master", "Edomae Precision", "Legend of Sushi"]
  },
  {
    id: "ichiran-shibuya-tokyo",
    name: "Ichiran Ramen Shibuya",
    cuisine: "Tonkotsu Pork Bone Ramen",
    location: "1-22-7 Jinnan, Shibuya-ku, Tokyo",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6617,
    lng: 139.7013,
    rating: 4.9,
    reviewCount: 8900,
    priceLevel: "¥¥",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Classic Tonkotsu Ramen with Secret Red Sauce", "Nitago Soft-Boiled Egg", "Chashu Pork Slices"],
    tags: ["Flavor Concentration Booths", "Customizable Richness", "Shibuya Icon"]
  },
  {
    id: "roppongi-robata-tokyo",
    name: "Inakaya East Roppongi",
    cuisine: "Traditional Robatayaki Charcoal Grill",
    location: "5-3-4 Roppongi, Minato-ku, Tokyo",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6628,
    lng: 139.7341,
    rating: 4.8,
    reviewCount: 1820,
    priceLevel: "¥¥¥¥",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["A5 Miyazaki Wagyu Skewers", "Charcoal Grilled King Crab", "Shiitake Mushrooms with Sea Salt"],
    tags: ["Theatrical Dining", "Paddle Presentation", "Roppongi Luxury"]
  },

  // ==========================================
  // NEW YORK CITY, USA
  // ==========================================
  {
    id: "katzs-delicatessen-nyc",
    name: "Katz's Delicatessen",
    cuisine: "Jewish Deli & Smoked Pastrami",
    location: "205 E Houston St, Lower East Side, New York, NY 10002",
    city: "New York",
    country: "United States",
    lat: 40.7222,
    lng: -73.9874,
    rating: 4.9,
    reviewCount: 9400,
    priceLevel: "$$",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Pastrami on Rye with Mustard", "Corned Beef Reuben", "Matzo Ball Soup", "Full Sour Pickles"],
    tags: ["Established 1888", "Mile-High Sandwiches", "NYC Icon", "Movie Famous"]
  },
  {
    id: "le-bernardin-nyc",
    name: "Le Bernardin by Eric Ripert",
    cuisine: "3-Star Michelin French Seafood",
    location: "155 W 51st St, Midtown West, New York, NY 10019",
    city: "New York",
    country: "United States",
    lat: 40.7615,
    lng: -73.9818,
    rating: 5.0,
    reviewCount: 3400,
    priceLevel: "$$$$",
    image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Tuna Ribbons with Foie Gras Crust", "Poached Halibut in Daikon Broth", "Warm Peekytoe Crab"],
    tags: ["3-Star Michelin", "World's 50 Best", "Unrivaled Seafood Elegance"]
  },
  {
    id: "lucali-brooklyn-nyc",
    name: "Lucali Pizza Brooklyn",
    cuisine: "Artisan Brick-Oven Pizza & Calzones",
    location: "575 Henry St, Carroll Gardens, Brooklyn, NY 11231",
    city: "New York",
    country: "United States",
    lat: 40.6818,
    lng: -73.9995,
    rating: 4.9,
    reviewCount: 4100,
    priceLevel: "$$$",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Crisp Thin Crust Pepperoni & Basil Pie", "Four-Cheese Ricotta Calzone", "House Tomato Dip"],
    tags: ["Cult Follower Queues", "Candlelit Brick Oven", "Best Pizza on Earth"]
  },

  // ==========================================
  // LONDON, UNITED KINGDOM
  // ==========================================
  {
    id: "dishoom-covent-london",
    name: "Dishoom Covent Garden",
    cuisine: "Bombay Irani Cafe & Grills",
    location: "12 Upper St Martin's Ln, London WC2H 9FB",
    city: "London",
    country: "United Kingdom",
    lat: 51.5126,
    lng: -0.1265,
    rating: 4.9,
    reviewCount: 7800,
    priceLevel: "££",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Bacon & Egg Naan Roll", "House Black Daal (Simmered 24h)", "Dishoom Chicken Ruby", "Chai Free-Refills"],
    tags: ["Bombay Nostalgia", "Cult Breakfast", "Covent Garden Line"]
  },
  {
    id: "the-ledbury-london",
    name: "The Ledbury",
    cuisine: "3-Star Michelin Modern British",
    location: "127 Ledbury Rd, Notting Hill, London W11 2AQ",
    city: "London",
    country: "United Kingdom",
    lat: 51.5182,
    lng: -0.2014,
    rating: 4.9,
    reviewCount: 2150,
    priceLevel: "££££",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Flame-Grilled Mackerel with Smoked Eel", "Roast Muntjac with Red Beetroot", "Truffled Toast"],
    tags: ["3-Star Michelin", "Notting Hill Sophistication", "Artisanal Foraging"]
  },

  // ==========================================
  // PARIS, FRANCE
  // ==========================================
  {
    id: "l-arpege-paris",
    name: "L'Arpège by Alain Passard",
    cuisine: "3-Star Michelin Biodynamic French Haute Cuisine",
    location: "84 Rue de Varenne, 75007 Paris",
    city: "Paris",
    country: "France",
    lat: 48.8558,
    lng: 2.3188,
    rating: 5.0,
    reviewCount: 2900,
    priceLevel: "€€€€",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Chaud-Froid Egg with Maple Syrup & Sherry", "Heirloom Vegetable Tasting Menu", "Apple Tart Bouquet"],
    tags: ["3-Star Michelin Legend", "Organic Farm to Table", "Master Chef Passard"]
  },
  {
    id: "le-relais-de-l-entrecote-paris",
    name: "Le Relais de Venise - L'Entrecôte",
    cuisine: "Classic French Steak Frites",
    location: "271 Bd Raspail, 75014 Paris",
    city: "Paris",
    country: "France",
    lat: 48.8385,
    lng: 2.3308,
    rating: 4.8,
    reviewCount: 6500,
    priceLevel: "€€",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Sirloin Steak in Famous Green Herb Butter Sauce", "Golden Crisp Pommes Frites", "Profiteroles with Warm Chocolate"],
    tags: ["Single-Menu Perfection", "Second Serving Guarantee", "Parisian Cult Classic"]
  },

  // ==========================================
  // ROME, ITALY
  // ==========================================
  {
    id: "rosmarino-roma",
    name: "Roscioli Ristorante Salumeria",
    cuisine: "Authentic Roman Pasta & Salumi",
    location: "Via dei Giubbonari, 21, 00186 Roma RM",
    city: "Rome",
    country: "Italy",
    lat: 41.8943,
    lng: 12.4744,
    rating: 4.9,
    reviewCount: 4600,
    priceLevel: "€€€",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Spaghetti alla Carbonara with Crispy Guanciale", "Cacio e Pepe", "Burrata with Cantabrian Anchovies"],
    tags: ["The Gold Standard of Carbonara", "Ancient Wine Cellar", "Campo de' Fiori"]
  },

  // ==========================================
  // SINGAPORE
  // ==========================================
  {
    id: "tian-tian-singapore",
    name: "Tian Tian Hainanese Chicken Rice",
    cuisine: "Singaporean Street & Hawker Delicacy",
    location: "Maxwell Food Centre, #01-10/11, 1 Kadayanallur St, Singapore 069184",
    city: "Singapore",
    country: "Singapore",
    lat: 1.2804,
    lng: 103.8448,
    rating: 4.9,
    reviewCount: 9200,
    priceLevel: "$",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Hainanese Poached Chicken Rice with Chilli Garlic Dip", "Crystal Chicken Feet", "Oyster Sauce Baby Bok Choy"],
    tags: ["Anthony Bourdain Approved", "Michelin Bib Gourmand", "Hawker Royalty"]
  },
  {
    id: "odette-singapore",
    name: "Odette at National Gallery",
    cuisine: "3-Star Michelin Modern French Artistry",
    location: "1 St Andrew's Rd, #01-04 National Gallery, Singapore 178957",
    city: "Singapore",
    country: "Singapore",
    lat: 1.2903,
    lng: 103.8519,
    rating: 5.0,
    reviewCount: 2200,
    priceLevel: "$$$$",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Rosemary Smoked Organic Egg", "Heirloom Beetroot Variation", "Marukyo Uni with Caviar"],
    tags: ["3-Star Michelin", "Asia's 50 Best #1", "Architectural Mastery"]
  },

  // ==========================================
  // DUBAI, UAE
  // ==========================================
  {
    id: "tresind-studio-dubai",
    name: "Trèsind Studio Dubai",
    cuisine: "2-Star Michelin Progressive Indian",
    location: "St. Regis Gardens, The Palm Jumeirah, Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    lat: 25.1189,
    lng: 55.1415,
    rating: 4.9,
    reviewCount: 1950,
    priceLevel: "$$$$",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Ghee Roast Crab with Blossom Honey", "Khandvi Sorbet", "Deconstructed Pani Puri Sphere", "Mutton Rogan Josh Puff"],
    tags: ["2-Star Michelin", "Progressive Indian Gastronomy", "Chef Himanshu Saini"]
  },
  {
    id: "al-ustad-special-kabab-dubai",
    name: "Al Ustad Special Kabab",
    cuisine: "Heritage Persian Grills & Yogurt Kebabs",
    location: "Al Musalla Rd, Near Al Fahidi Metro, Bur Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    lat: 25.2602,
    lng: 55.2974,
    rating: 4.8,
    reviewCount: 5400,
    priceLevel: "$$",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Special Yogurt-Marinated Mutton Kebab (Kabab Khas)", "Joojeh Chicken Kabab", "Saffron Rice with Butter"],
    tags: ["Since 1978", "Wall-to-Wall Celebrity Photos", "Old Dubai Soul"]
  },

  // ==========================================
  // BANGKOK, THAILAND
  // ==========================================
  {
    id: "jay-fai-bangkok",
    name: "Raan Jay Fai",
    cuisine: "Michelin-Starred Wok Street Seafood",
    location: "327 Maha Chai Rd, Samran Rat, Phra Nakhon, Bangkok 10200",
    city: "Bangkok",
    country: "Thailand",
    lat: 13.7526,
    lng: 100.5048,
    rating: 4.9,
    reviewCount: 5200,
    priceLevel: "$$$",
    image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Massive Lump Crab Meat Omelette (Kai-Jeaw Poo)", "Drunken Seafood Noodles (Pad Kee Mao)", "Dry Tom Yum Soup"],
    tags: ["1-Star Michelin Street Legend", "Goggles Master Chef", "Wok Hei Volcano"]
  },

  // ==========================================
  // SYDNEY, AUSTRALIA
  // ==========================================
  {
    id: "quay-sydney",
    name: "Quay Restaurant Sydney",
    cuisine: "Modern Australian Fine Dining overlooking Opera House",
    location: "Upper Level Overseas Passenger Terminal, The Rocks NSW 2000",
    city: "Sydney",
    country: "Australia",
    lat: -33.8587,
    lng: 151.2099,
    rating: 4.9,
    reviewCount: 2300,
    priceLevel: "$$$$",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Peter Gilmore's Snow Egg", "Smoked Eel with Sea Pearls", "Maremma Duck with Confit Endive"],
    tags: ["Panoramic Harbour Views", "Culinary Masterpiece", "Three Chef Hats"]
  },

  // ==========================================
  // SRMAP CAMPUS & AMARAVATI HUB
  // ==========================================
  {
    id: "srmap-food-hub",
    name: "SRMAP Campus Culinary Square",
    cuisine: "Multi-Regional Indian & Street Eats",
    location: "SRM University AP Campus, Neerukonda, Mangalagiri, Andhra Pradesh",
    city: "Amaravati (SRMAP)",
    country: "India",
    lat: 16.4819,
    lng: 80.5050,
    rating: 4.7,
    reviewCount: 1450,
    priceLevel: "₹",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    signatureDishes: ["Midnight Guntur Egg Fried Rice", "Ghee Karam Dosa", "Double Cheese Grilled Sandwich", "Thick Cold Coffee"],
    tags: ["Student Hub", "Campus Favorite", "Fast Casual", "Midnight Snacks"]
  }
];
