import { MenuItem, Restaurant } from "../types";

// Curated high-aesthetic menu card scans per cuisine family
const CUISINE_MENU_CARDS: Record<string, string[]> = {
  biryani: [
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85"
  ],
  southIndian: [
    "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=85"
  ],
  northIndian: [
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85"
  ],
  asian: [
    "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=85"
  ],
  cafe: [
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85"
  ],
  italian: [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85"
  ],
  default: [
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85"
  ]
};

function getPriceMultiplier(priceLevel?: string): number {
  switch (priceLevel) {
    case "₹": return 0.7;
    case "₹₹": return 1.0;
    case "₹₹₹": return 1.6;
    case "₹₹₹₹": return 2.5;
    default: return 1.0;
  }
}

/**
 * Returns physical menu card images for a restaurant
 */
export function getMenuCardsForRestaurant(restaurant: Restaurant): string[] {
  if (restaurant.menuCards && restaurant.menuCards.length > 0) {
    return restaurant.menuCards;
  }

  const c = (restaurant.cuisine || "").toLowerCase();
  if (c.includes("biryani") || c.includes("mughlai") || c.includes("hyderabadi") || c.includes("kebab")) {
    return CUISINE_MENU_CARDS.biryani;
  }
  if (c.includes("south") || c.includes("dosa") || c.includes("tiffin") || c.includes("andhra") || c.includes("chettinad")) {
    return CUISINE_MENU_CARDS.southIndian;
  }
  if (c.includes("asian") || c.includes("sushi") || c.includes("thai") || c.includes("chinese") || c.includes("japanese")) {
    return CUISINE_MENU_CARDS.asian;
  }
  if (c.includes("cafe") || c.includes("bakery") || c.includes("coffee") || c.includes("dessert")) {
    return CUISINE_MENU_CARDS.cafe;
  }
  if (c.includes("pizza") || c.includes("italian") || c.includes("pasta")) {
    return CUISINE_MENU_CARDS.italian;
  }
  if (c.includes("north") || c.includes("punjabi") || c.includes("curry")) {
    return CUISINE_MENU_CARDS.northIndian;
  }

  return CUISINE_MENU_CARDS.default;
}

/**
 * Generates an authentic structured digital menu for a restaurant
 */
export function getDigitalMenuForRestaurant(restaurant: Restaurant): MenuItem[] {
  if (restaurant.menuList && restaurant.menuList.length > 0) {
    return restaurant.menuList;
  }

  const mult = getPriceMultiplier(restaurant.priceLevel);
  const p = (base: number) => `₹${Math.round((base * mult) / 10) * 10}`;
  const c = (restaurant.cuisine || "").toLowerCase();

  const signatureItems = [
    ...(restaurant.signatureDish ? [restaurant.signatureDish] : []),
    ...(restaurant.signatureDishes || []),
    ...(restaurant.menuItems || [])
  ].filter(Boolean);

  const uniqueSignatures = Array.from(new Set(signatureItems));

  const items: MenuItem[] = [];

  // If Biryani / Mughlai / Hyderabadi
  if (c.includes("biryani") || c.includes("mughlai") || c.includes("hyderabadi")) {
    items.push(
      {
        id: "m-1",
        name: uniqueSignatures[0] || "Special Chicken Dum Biryani",
        category: "Biryani & Rice",
        price: p(360),
        isVeg: false,
        isMustOrder: true,
        description: "Fragrant long-grain aged basmati, slow-cooked in sealed handi with tender spiced meat and saffron.",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "m-2",
        name: uniqueSignatures[1] || "Mutton Dum Biryani (Zaffrani)",
        category: "Biryani & Rice",
        price: p(440),
        isVeg: false,
        isMustOrder: true,
        description: "Classic Nizami style succulent baby mutton chunks marinated in hung curd and pot-roasted spices.",
        image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "m-3",
        name: "Shahi Paneer Dum Biryani",
        category: "Biryani & Rice",
        price: p(320),
        isVeg: true,
        isMustOrder: false,
        description: "Golden char-grilled malai paneer layered with aromatic spiced rice, mint, and crisp fried onions."
      },
      {
        id: "m-4",
        name: "Tangdi Kebab (4 Pcs)",
        category: "Starters & Tandoor",
        price: p(340),
        isVeg: false,
        isMustOrder: true,
        description: "Chicken drumsticks stuffed with minced lamb and grilled over charcoal with royal spices."
      },
      {
        id: "m-5",
        name: "Chicken 65 (Authentic Hyderabadi)",
        category: "Starters & Tandoor",
        price: p(310),
        isVeg: false,
        isMustOrder: true,
        description: "Crispy chicken tossed with curry leaves, mustard seeds, green chillies, and signature red masala."
      },
      {
        id: "m-6",
        name: "Tandoori Malai Paneer Tikka",
        category: "Starters & Tandoor",
        price: p(280),
        isVeg: true,
        isMustOrder: false,
        description: "Melt-in-mouth cottage cheese marinated with cardamom cream and bell peppers."
      },
      {
        id: "m-7",
        name: "Murgh Butter Masala",
        category: "Main Course & Curries",
        price: p(380),
        isVeg: false,
        isMustOrder: false,
        description: "Roasted tandoori chicken simmered in a velvety makhani gravy enriched with butter and fenugreek."
      },
      {
        id: "m-8",
        name: "Dal Makhani Grand",
        category: "Main Course & Curries",
        price: p(260),
        isVeg: true,
        isMustOrder: true,
        description: "Black lentils slow-cooked overnight over slow coal fire with churned white butter."
      },
      {
        id: "m-9",
        name: "Garlic Butter Naan",
        category: "Breads",
        price: p(70),
        isVeg: true,
        isMustOrder: false,
        description: "Clay-oven baked leavened bread brushed with garlic butter and fresh coriander."
      },
      {
        id: "m-10",
        name: "Double Ka Meetha",
        category: "Desserts & Drinks",
        price: p(160),
        isVeg: true,
        isMustOrder: true,
        description: "Traditional Hyderabadi bread pudding soaked in saffron rabri and toasted pistachios."
      },
      {
        id: "m-11",
        name: "Special Irani Chai",
        category: "Desserts & Drinks",
        price: p(60),
        isVeg: true,
        isMustOrder: false,
        description: "Condensed mawa milk decoction brewed with secret spice blend."
      }
    );
  } else if (c.includes("south") || c.includes("dosa") || c.includes("tiffin")) {
    items.push(
      {
        id: "m-1",
        name: uniqueSignatures[0] || "Ghee Karam Dosa",
        category: "Specialty Dosas",
        price: p(180),
        isVeg: true,
        isMustOrder: true,
        description: "Crispy crepe smeared with fiery red chilli garlic paste and pure desi cow ghee."
      },
      {
        id: "m-2",
        name: "Pesarattu Upma",
        category: "Specialty Dosas",
        price: p(160),
        isVeg: true,
        isMustOrder: true,
        description: "Whole green gram crepe stuffed with ginger rava upma, served with allam chutney."
      },
      {
        id: "m-3",
        name: "Cheese Butter Paneer Dosa",
        category: "Specialty Dosas",
        price: p(220),
        isVeg: true,
        isMustOrder: false,
        description: "Loaded with melted mozzarella, butter masala paneer, and spring onions."
      },
      {
        id: "m-4",
        name: "Medu Vada (2 Pcs) with Sambar Dip",
        category: "Tiffins & Starters",
        price: p(110),
        isVeg: true,
        isMustOrder: false,
        description: "Golden crisp lentil fritters with crushed black pepper, dipped in hot drumstick sambar."
      },
      {
        id: "m-5",
        name: "Ghee Podi Idli (Tawa Tossed)",
        category: "Tiffins & Starters",
        price: p(140),
        isVeg: true,
        isMustOrder: true,
        description: "Steamed mini idlis tossed in gun-powder spice and hot melted butter."
      },
      {
        id: "m-6",
        name: "Special South Indian Thali",
        category: "Meals & Rice",
        price: p(280),
        isVeg: true,
        isMustOrder: false,
        description: "Royal feast with Kootu, Poriyal, Sambar, Rasam, Curd, Appalam, and Sweet."
      },
      {
        id: "m-7",
        name: "Filter Coffee Degree",
        category: "Desserts & Drinks",
        price: p(70),
        isVeg: true,
        isMustOrder: true,
        description: "Freshly roasted chicory blend frothed with hot creamy milk in brass davarah."
      }
    );
  } else if (c.includes("asian") || c.includes("sushi") || c.includes("chinese") || c.includes("thai")) {
    items.push(
      {
        id: "m-1",
        name: uniqueSignatures[0] || "Crispy Truffle Dim Sum",
        category: "Dim Sum & Bao",
        price: p(360),
        isVeg: true,
        isMustOrder: true,
        description: "Wild exotic mushrooms infused with black truffle oil and wrapped in delicate translucent pastry."
      },
      {
        id: "m-2",
        name: "Spicy Prawn & Chive Har Gow",
        category: "Dim Sum & Bao",
        price: p(440),
        isVeg: false,
        isMustOrder: true,
        description: "Steamed crystal dumplings bursting with seasoned king prawns and chives."
      },
      {
        id: "m-3",
        name: "Salmon California Roll (8 Pcs)",
        category: "Sushi & Sashimi",
        price: p(520),
        isVeg: false,
        isMustOrder: true,
        description: "Fresh Norwegian salmon, hass avocado, cucumber, and tobiko."
      },
      {
        id: "m-4",
        name: "Thai Green Curry Bowl with Jasmine Rice",
        category: "Wok & Bowls",
        price: p(410),
        isVeg: true,
        isMustOrder: false,
        description: "Aromatic coconut milk curry with Thai basil, bamboo shoots, and kaffir lime."
      },
      {
        id: "m-5",
        name: "Chilli Garlic Hakka Noodles",
        category: "Wok & Bowls",
        price: p(320),
        isVeg: true,
        isMustOrder: false,
        description: "Hand-pulled wok-tossed noodles with burnt garlic, scallions, and bird's eye chillies."
      }
    );
  } else if (c.includes("cafe") || c.includes("bakery") || c.includes("coffee") || c.includes("burger")) {
    items.push(
      {
        id: "m-1",
        name: uniqueSignatures[0] || "Smoked Truffle Smash Burger",
        category: "Burgers & Mains",
        price: p(390),
        isVeg: false,
        isMustOrder: true,
        description: "Double smashed tender patties, caramelized shallots, melted gouda, and truffle aioli on brioche."
      },
      {
        id: "m-2",
        name: "Artisan Sourdough Avocado Toast",
        category: "Small Plates & All Day",
        price: p(340),
        isVeg: true,
        isMustOrder: true,
        description: "Hass avocado, crumbled feta, cherry tomatoes, and micro-greens on house-baked toasted sourdough."
      },
      {
        id: "m-3",
        name: "Truffle Parmesan French Fries",
        category: "Small Plates & All Day",
        price: p(240),
        isVeg: true,
        isMustOrder: false,
        description: "Crispy double-cooked potato batons tossed in Italian truffle oil and aged parmesan."
      },
      {
        id: "m-4",
        name: "Spanish Iced Latte (Condensed Milk)",
        category: "Specialty Coffee & Drinks",
        price: p(220),
        isVeg: true,
        isMustOrder: true,
        description: "Double espresso shot layered with chilled condensed milk and organic whole milk."
      },
      {
        id: "m-5",
        name: "Belgian Dark Chocolate Sea Salt Brownie",
        category: "Desserts",
        price: p(210),
        isVeg: true,
        isMustOrder: true,
        description: "Warm fudgy 70% Callebaut dark chocolate cake with flaky Maldon sea salt."
      }
    );
  } else {
    // General / Continental / Multi-Cuisine
    items.push(
      {
        id: "m-1",
        name: uniqueSignatures[0] || `${restaurant.name} Chef's Signature Special`,
        category: "Chef's Specials",
        price: p(450),
        isVeg: false,
        isMustOrder: true,
        description: "Masterfully prepared house specialty showcasing the chef's culinary philosophy.",
        image: restaurant.image
      },
      {
        id: "m-2",
        name: "Woodfired Margherita Pizza",
        category: "Mains & Pizzas",
        price: p(380),
        isVeg: true,
        isMustOrder: true,
        description: "San Marzano tomato base, fresh buffalo mozzarella, virgin olive oil, and sweet basil."
      },
      {
        id: "m-3",
        name: "Peri-Peri Crispy Chicken Tenders",
        category: "Starters & Appetizers",
        price: p(320),
        isVeg: false,
        isMustOrder: false,
        description: "Spicy hand-breaded chicken strips served with house smoked garlic dip."
      },
      {
        id: "m-4",
        name: "Creamy Truffle Wild Mushroom Pasta",
        category: "Mains & Pizzas",
        price: p(420),
        isVeg: true,
        isMustOrder: true,
        description: "Fettuccine pasta in rich parmigiano reggiano reduction with porcini and white truffle."
      },
      {
        id: "m-5",
        name: "Signature Berry Cheesecake",
        category: "Desserts & Beverages",
        price: p(250),
        isVeg: true,
        isMustOrder: true,
        description: "Classic New York style baked cheesecake topped with wild blueberry coulis."
      }
    );
  }

  // Ensure any unique signatures specified in the restaurant record are included
  uniqueSignatures.forEach((sig, idx) => {
    if (!items.some(it => it.name.toLowerCase() === sig.toLowerCase())) {
      items.unshift({
        id: `sig-${idx}`,
        name: sig,
        category: "Chef's Specials",
        price: p(380 + idx * 40),
        isVeg: !sig.toLowerCase().includes("chicken") && !sig.toLowerCase().includes("mutton") && !sig.toLowerCase().includes("fish") && !sig.toLowerCase().includes("prawn"),
        isMustOrder: true,
        description: `Highly praised critic pick at ${restaurant.name}. A quintessential must-try.`,
        image: idx === 0 ? restaurant.image : undefined
      });
    }
  });

  return items;
}
