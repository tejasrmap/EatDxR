-- ==============================================================================
-- MADEATER POSTGRESQL SCHEMA FOR SUPABASE
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vpglhptegnccrcrdkpwv/sql
-- ==============================================================================

-- 1. PROFILES TABLE (Mapped to Firebase Auth UID)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Firebase Auth currentUser.uid
  display_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  photo_url TEXT,
  bio TEXT DEFAULT '',
  pronouns TEXT,
  favorite_cuisines TEXT[] DEFAULT '{}',
  critic_level TEXT DEFAULT 'Foodie',
  credibility_score INTEGER DEFAULT 50,
  is_verified_critic BOOLEAN DEFAULT FALSE,
  taste_dna JSONB DEFAULT '{"spice":60,"indian":75,"nonVeg":50,"asian":40,"desserts":50,"coffee":70,"personaTitle":"The Flavor Explorer"}'::jsonb,
  stats JSONB DEFAULT '{"mealsLogged":0,"reviewsWritten":0,"followers":0,"following":0,"followingList":[]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS public.restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  rating NUMERIC(3,1) DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  image TEXT,
  price_level TEXT DEFAULT '₹₹',
  hours TEXT DEFAULT '11:00 AM - 11:00 PM',
  signature_dish TEXT,
  lat NUMERIC(10,6),
  lng NUMERIC(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DISHES TABLE
CREATE TABLE IF NOT EXISTS public.dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  image TEXT,
  madeater_score NUMERIC(3,1) DEFAULT 9.0,
  price NUMERIC(10,2),
  description TEXT,
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. REVIEWS & MEAL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_photo TEXT,
  user_critic_level TEXT DEFAULT 'Foodie',
  restaurant_id TEXT,
  restaurant_name TEXT NOT NULL,
  restaurant_location TEXT,
  city TEXT DEFAULT 'Hyderabad',
  dishes JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC(3,1) NOT NULL DEFAULT 8.5,
  content TEXT,
  video_url TEXT,
  likes INTEGER DEFAULT 0,
  type TEXT DEFAULT 'review',
  ratings_detail JSONB DEFAULT '{"taste":9,"quality":9,"portion":8,"value":8}'::jsonb,
  is_verified_visit BOOLEAN DEFAULT FALSE,
  visit_proof_type TEXT DEFAULT 'self',
  craving_tag TEXT,
  attached_dish TEXT,
  attached_cuisine TEXT,
  attached_score NUMERIC(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRAVINGS (SHORT-FORM VIDEO REELS) TABLE
CREATE TABLE IF NOT EXISTS public.cravings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_photo TEXT,
  restaurant_name TEXT NOT NULL,
  dish_name TEXT,
  video_url TEXT NOT NULL,
  city TEXT DEFAULT 'Hyderabad',
  content TEXT,
  dishes JSONB DEFAULT '[]'::jsonb,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  craving_tag TEXT DEFAULT 'Street Food',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. FOOD LISTS TABLE
CREATE TABLE IF NOT EXISTS public.lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_photo TEXT,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  likes INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'review' or 'craving'
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_photo TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. LIKES TABLE
CREATE TABLE IF NOT EXISTS public.likes (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'review', 'craving', 'list'
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(target_id, user_id)
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_photo TEXT,
  type TEXT NOT NULL, -- 'like', 'comment', 'follow'
  message TEXT NOT NULL,
  target_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cravings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Restaurants are viewable by everyone" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Dishes are viewable by everyone" ON public.dishes FOR SELECT USING (true);
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Cravings are viewable by everyone" ON public.cravings FOR SELECT USING (true);
CREATE POLICY "Public lists are viewable by everyone" ON public.lists FOR SELECT USING (true);
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Notifications are viewable by recipient" ON public.notifications FOR SELECT USING (true);

-- Allow Permissive Inserts & Updates for Anon Key
CREATE POLICY "Allow all inserts on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow all inserts on reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on reviews" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on reviews" ON public.reviews FOR DELETE USING (true);

CREATE POLICY "Allow all inserts on cravings" ON public.cravings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on cravings" ON public.cravings FOR UPDATE USING (true);

CREATE POLICY "Allow all inserts on lists" ON public.lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on lists" ON public.lists FOR UPDATE USING (true);

CREATE POLICY "Allow all inserts on comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts on likes" ON public.likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all deletes on likes" ON public.likes FOR DELETE USING (true);

CREATE POLICY "Allow all inserts on restaurants" ON public.restaurants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts on dishes" ON public.dishes FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- SUPABASE STORAGE BUCKET CREATION (FOR MEDIA)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dish-media', 'dish-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Media Access" ON storage.objects FOR SELECT USING (bucket_id = 'dish-media');
CREATE POLICY "Allow Media Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dish-media');

-- ==============================================================================
-- SEED INITIAL RESTAURANTS & DISHES
-- ==============================================================================
INSERT INTO public.restaurants (id, name, cuisine, location, city, rating, review_count, image, price_level, signature_dish, lat, lng)
VALUES
  ('rest-1', 'Bawarchi Restaurant', 'Hyderabadi Biryani', 'RTC Cross Roads', 'Hyderabad', 4.9, 1420, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', '₹₹', 'Special Mutton Biryani', 17.4089, 78.4908),
  ('rest-2', 'Chutneys', 'South Indian Deluxe', 'Banjara Hills, Road No. 3', 'Hyderabad', 4.8, 890, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', '₹₹', 'Guntur Idli', 17.4225, 78.4344),
  ('rest-3', 'Ram Ki Bandi', 'Late-Night Street Food', 'Mozamjahi Market', 'Hyderabad', 4.9, 2150, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', '₹', 'Cheese Butter Dosa', 17.3850, 78.4867),
  ('rest-4', 'Concu Pastry Boutique', 'French Patisserie', 'Jubilee Hills, Road No. 36', 'Hyderabad', 4.9, 640, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', '₹₹₹', 'Tiramisu Choux', 17.4325, 78.3995)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dishes (id, name, category, image, madeater_score, price, description, restaurant_id)
VALUES
  ('dish-1', 'Hyderabadi Dum Biryani', 'Biryani & Rice', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', 9.8, 380, 'Slow-cooked spiced mutton layered with saffron fragrant basmati rice.', 'rest-1'),
  ('dish-2', 'Cheese Butter Dosa', 'South Indian', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', 9.6, 120, 'Crispy paper-thin crepe drenched in pure butter and shredded cheese.', 'rest-3'),
  ('dish-3', 'Guntur Steam Idli', 'Breakfast', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 9.4, 90, 'Fluffy steamed rice cakes sprinkled with fiery red chili podi.', 'rest-2')
ON CONFLICT (id) DO NOTHING;
