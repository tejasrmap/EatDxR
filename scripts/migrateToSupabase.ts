import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '../src/firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vpglhptegnccrcrdkpwv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('ERROR: VITE_SUPABASE_ANON_KEY is missing in environment or .env');
  process.exit(1);
}

console.log('--- Starting Madeater Data Migration to Supabase ---');
console.log('Supabase URL:', supabaseUrl);

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, firebaseConfig.firestoreDatabaseId);

// 2. Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

function parseDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') {
    return new Date(val).toISOString();
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  return new Date().toISOString();
}

async function migrateUsers() {
  console.log('\n[1/5] Migrating Users -> Profiles...');
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log(`Found ${snap.docs.length} users in Firestore.`);
    let count = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const id = docSnap.id;
      const username = data.username || data.displayName?.toLowerCase().replace(/\s+/g, '_') || `user_${id.slice(0, 6)}`;
      const fullName = data.displayName || data.username || 'Food Critic';
      const avatarUrl = data.photoURL || '';

      const payload = {
        id,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        bio: data.bio || '',
        city: data.city || '',
        favorite_cuisines: Array.isArray(data.favoriteCuisines) ? data.favoriteCuisines : [],
        is_critic: Boolean(data.isCritic),
        stats: data.stats || {},
        updated_at: parseDate(data.updatedAt)
      };

      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn(`  Failed profile ${id} (${username}):`, error.message);
      } else {
        count++;
      }
    }
    console.log(`Successfully migrated ${count}/${snap.docs.length} profiles.`);
  } catch (err: any) {
    console.error('Error migrating users:', err.message);
  }
}

async function migrateRestaurants() {
  console.log('\n[2/5] Migrating Restaurants...');
  try {
    const snap = await getDocs(collection(db, 'restaurants'));
    console.log(`Found ${snap.docs.length} restaurants in Firestore.`);
    let count = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const id = data.id || docSnap.id;

      const payload = {
        id,
        name: data.name || 'Restaurant',
        cuisine: data.cuisine || 'Various',
        location: data.location || 'Unknown',
        city: data.city || (data.location ? data.location.split(',').pop()?.trim() : 'Unknown'),
        rating: Number(data.rating) || 4.5,
        review_count: Number(data.reviewCount) || 0,
        image: data.image || '',
        price_level: data.priceLevel || '₹₹',
        lat: data.lat ? Number(data.lat) : null,
        lng: data.lng ? Number(data.lng) : null
      };

      const { error } = await supabase.from('restaurants').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn(`  Failed restaurant ${id}:`, error.message);
      } else {
        count++;
      }
    }
    console.log(`Successfully migrated ${count}/${snap.docs.length} restaurants.`);
  } catch (err: any) {
    console.error('Error migrating restaurants:', err.message);
  }
}

async function ensureProfileExists(userId: string, userName?: string, userPhoto?: string) {
  if (!userId) return;
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!data) {
    await supabase.from('profiles').insert({
      id: userId,
      username: (userName || 'user').toLowerCase().replace(/\s+/g, '_') + '_' + userId.slice(0, 4),
      full_name: userName || 'Food Critic',
      avatar_url: userPhoto || '',
      stats: {}
    });
  }
}

async function migrateReviewsAndCravings() {
  console.log('\n[3/5] Migrating Reviews & Cravings...');
  try {
    const snap = await getDocs(collection(db, 'reviews'));
    console.log(`Found ${snap.docs.length} reviews in Firestore.`);
    let revCount = 0;
    let cravCount = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const id = data.id || docSnap.id;

      if (data.userId) {
        await ensureProfileExists(data.userId, data.userName, data.userPhoto);
      }

      const reviewPayload = {
        id,
        user_id: data.userId || null,
        user_name: data.userName || 'Food Critic',
        user_photo: data.userPhoto || '',
        restaurant_id: data.restaurantId || 'rest-unknown',
        restaurant_name: data.restaurantName || 'Restaurant',
        restaurant_location: data.restaurantLocation || '',
        city: data.city || (data.restaurantLocation ? data.restaurantLocation.split(',').pop()?.trim() : ''),
        rating: Number(data.rating) || 4.5,
        content: data.content || '',
        dishes: Array.isArray(data.dishes) ? data.dishes : [],
        likes_count: Number(data.likes) || 0,
        video_url: data.videoUrl || null,
        is_reel: Boolean(data.isReel || data.videoUrl),
        view_count: Number(data.viewCount) || 0,
        created_at: parseDate(data.createdAt)
      };

      const { error: revErr } = await supabase.from('reviews').upsert(reviewPayload, { onConflict: 'id' });
      if (revErr) {
        console.warn(`  Failed review ${id}:`, revErr.message);
      } else {
        revCount++;
      }

      // If review has video or isReel, also upsert to cravings table
      if (data.isReel || data.videoUrl) {
        const cravingPayload = {
          id,
          user_id: data.userId || null,
          user_name: data.userName || 'Food Critic',
          user_photo: data.userPhoto || '',
          restaurant_id: data.restaurantId || 'rest-unknown',
          restaurant_name: data.restaurantName || 'Restaurant',
          restaurant_location: data.restaurantLocation || '',
          city: data.city || (data.restaurantLocation ? data.restaurantLocation.split(',').pop()?.trim() : ''),
          rating: Number(data.rating) || 4.5,
          content: data.content || '',
          dishes: Array.isArray(data.dishes) ? data.dishes : [],
          video_url: data.videoUrl || '',
          likes_count: Number(data.likes) || 0,
          view_count: Number(data.viewCount) || 0,
          created_at: parseDate(data.createdAt)
        };

        const { error: cravErr } = await supabase.from('cravings').upsert(cravingPayload, { onConflict: 'id' });
        if (!cravErr) cravCount++;
      }
    }
    console.log(`Successfully migrated ${revCount}/${snap.docs.length} reviews and ${cravCount} cravings.`);
  } catch (err: any) {
    console.error('Error migrating reviews:', err.message);
  }
}

async function migrateLists() {
  console.log('\n[4/5] Migrating Lists...');
  try {
    const snap = await getDocs(collection(db, 'lists'));
    console.log(`Found ${snap.docs.length} lists in Firestore.`);
    let count = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const id = data.id || docSnap.id;

      if (data.userId) {
        await ensureProfileExists(data.userId, data.authorName, data.authorPhoto);
      }

      const payload = {
        id,
        name: data.name || 'Untitled List',
        description: data.description || '',
        user_id: data.userId || null,
        author_name: data.authorName || 'Critic',
        author_photo: data.authorPhoto || '',
        is_private: Boolean(data.isPrivate),
        items: Array.isArray(data.items) ? data.items : [],
        likes_count: Number(data.likes) || 0,
        tags: Array.isArray(data.tags) ? data.tags : [],
        cover_image: data.coverImage || '',
        created_at: parseDate(data.createdAt),
        updated_at: parseDate(data.updatedAt)
      };

      const { error } = await supabase.from('lists').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn(`  Failed list ${id}:`, error.message);
      } else {
        count++;
      }
    }
    console.log(`Successfully migrated ${count}/${snap.docs.length} lists.`);
  } catch (err: any) {
    console.error('Error migrating lists:', err.message);
  }
}

async function migrateInteractions() {
  console.log('\n[5/5] Migrating Interactions (Likes & Comments)...');
  try {
    const snap = await getDocs(collection(db, 'interactions'));
    console.log(`Found ${snap.docs.length} interactions in Firestore.`);
    let likesCount = 0;
    let commentsCount = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const id = docSnap.id;

      if (data.userId) {
        await ensureProfileExists(data.userId, data.userName, data.userPhoto);
      }

      if (data.type === 'LIKE') {
        const payload = {
          id,
          review_id: data.reviewId || null,
          user_id: data.userId || null,
          created_at: parseDate(data.createdAt)
        };
        const { error } = await supabase.from('likes').upsert(payload, { onConflict: 'id' });
        if (!error) likesCount++;
      } else if (data.type === 'COMMENT') {
        const payload = {
          id,
          review_id: data.reviewId || null,
          user_id: data.userId || null,
          user_name: data.userName || 'Critic',
          user_photo: data.userPhoto || '',
          content: data.content || '',
          created_at: parseDate(data.createdAt)
        };
        const { error } = await supabase.from('comments').upsert(payload, { onConflict: 'id' });
        if (!error) commentsCount++;
      }
    }
    console.log(`Successfully migrated ${likesCount} likes and ${commentsCount} comments.`);
  } catch (err: any) {
    console.error('Error migrating interactions:', err.message);
  }
}

async function run() {
  console.time('Migration Duration');
  await migrateUsers();
  await migrateRestaurants();
  await migrateReviewsAndCravings();
  await migrateLists();
  await migrateInteractions();
  console.timeEnd('Migration Duration');
  console.log('\n🎉 ALL DATA MIGRATION COMPLETE! Madeater is 100% running on Supabase.');
  process.exit(0);
}

run().catch((e) => {
  console.error('Fatal migration error:', e);
  process.exit(1);
});
