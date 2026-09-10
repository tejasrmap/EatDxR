import { supabase, isSupabaseConfigured } from '../supabase';
import { User, Review, Restaurant, DishEntity, FoodList } from '../types';
import { MOCK_CRAVINGS, MOCK_DISHES, MOCK_LISTS } from '../data/mockData';
import { GLOBAL_RESTAURANTS } from '../data/globalRestaurants';

const DEFAULT_FALLBACK_RESTAURANTS: Restaurant[] = GLOBAL_RESTAURANTS;

// ----------------------------------------------------------------------------
// 1. PROFILES / USERS
// ----------------------------------------------------------------------------

export async function getProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      uid: data.id,
      displayName: data.display_name,
      username: data.username,
      email: data.email,
      photoURL: data.photo_url,
      bio: data.bio,
      pronouns: data.pronouns,
      favoriteCuisines: data.favorite_cuisines || [],
      criticLevel: data.critic_level,
      credibilityScore: data.credibility_score,
      isVerifiedCritic: data.is_verified_critic,
      tasteDNA: data.taste_dna,
      stats: data.stats || { mealsLogged: 0, reviewsWritten: 0, followers: 0, following: 0 },
      createdAt: data.created_at
    };
  } catch (err) {
    console.warn('[Supabase] Failed to fetch profile, using fallback:', err);
    return null;
  }
}

export async function upsertProfile(user: User): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.uid,
        display_name: user.displayName,
        username: user.username,
        email: user.email,
        photo_url: user.photoURL,
        bio: user.bio,
        pronouns: user.pronouns,
        favorite_cuisines: user.favoriteCuisines,
        critic_level: user.criticLevel,
        credibility_score: user.credibilityScore,
        is_verified_critic: user.isVerifiedCritic,
        taste_dna: user.tasteDNA,
        stats: user.stats,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (err) {
    console.warn('[Supabase] Error upserting profile:', err);
  }
}

// ----------------------------------------------------------------------------
// 2. REVIEWS & MEAL LOGS
// ----------------------------------------------------------------------------

export async function getReviews(city?: string): Promise<Review[]> {
  if (!isSupabaseConfigured) return MOCK_CRAVINGS;

  try {
    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (city && city !== 'All') {
      query = query.ilike('city', `%${city}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return MOCK_CRAVINGS;
    }

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || 'Food Critic',
      userPhoto: r.user_photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.user_id}`,
      userCriticLevel: r.user_critic_level || 'Foodie',
      restaurantId: r.restaurant_id || 'rest-1',
      restaurantName: r.restaurant_name,
      restaurantLocation: r.restaurant_location,
      city: r.city,
      dishes: r.dishes || [],
      rating: Number(r.rating) || 8.5,
      content: r.content || '',
      videoUrl: r.video_url,
      likes: r.likes || 0,
      ratingsDetail: r.ratings_detail,
      isVerifiedVisit: r.is_verified_visit,
      visitProofType: r.visit_proof_type,
      type: r.type || 'review',
      createdAt: r.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] Error fetching reviews, falling back to mock:', err);
    return MOCK_CRAVINGS;
  }
}

export async function createReview(review: Partial<Review>): Promise<Review> {
  const newReview: Review = {
    id: review.id || `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userId: review.userId || 'anonymous',
    userName: review.userName || 'Food Critic',
    userPhoto: review.userPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    userCriticLevel: review.userCriticLevel || 'Foodie',
    restaurantId: review.restaurantId || 'rest-1',
    restaurantName: review.restaurantName || 'Dining Spot',
    restaurantLocation: review.restaurantLocation || review.city || 'Hyderabad',
    city: review.city || 'Hyderabad',
    dishes: review.dishes || [],
    rating: review.rating || 9.0,
    content: review.content || '',
    videoUrl: review.videoUrl,
    likes: 0,
    ratingsDetail: review.ratingsDetail,
    isVerifiedVisit: review.isVerifiedVisit || false,
    visitProofType: review.visitProofType || 'self',
    type: review.type || 'review',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('reviews').insert({
        id: newReview.id,
        user_id: newReview.userId,
        user_name: newReview.userName,
        user_photo: newReview.userPhoto,
        user_critic_level: newReview.userCriticLevel,
        restaurant_id: newReview.restaurantId,
        restaurant_name: newReview.restaurantName,
        restaurant_location: newReview.restaurantLocation,
        city: newReview.city,
        dishes: newReview.dishes,
        rating: newReview.rating,
        content: newReview.content,
        video_url: newReview.videoUrl,
        likes: newReview.likes,
        type: newReview.type,
        ratings_detail: newReview.ratingsDetail,
        is_verified_visit: newReview.isVerifiedVisit,
        visit_proof_type: newReview.visitProofType,
        created_at: newReview.createdAt
      });
      if (error) console.warn('[Supabase] Insert review warning:', error.message);
    } catch (err) {
      console.warn('[Supabase] Failed to write review to remote DB:', err);
    }
  }

  return newReview;
}

// ----------------------------------------------------------------------------
// 3. CRAVINGS (SHORT VIDEO REELS)
// ----------------------------------------------------------------------------

export async function getCravings(): Promise<Review[]> {
  if (!isSupabaseConfigured) return MOCK_CRAVINGS;

  try {
    const { data, error } = await supabase
      .from('cravings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!data || data.length === 0) return MOCK_CRAVINGS;

    return data.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      userName: c.user_name || 'Food Critic',
      userPhoto: c.user_photo,
      restaurantId: 'crav-rest',
      restaurantName: c.restaurant_name,
      dishName: c.dish_name,
      city: c.city,
      videoUrl: c.video_url,
      content: c.content || '',
      dishes: c.dishes || [],
      rating: 9.5,
      likes: c.likes || 0,
      cravingTag: c.craving_tag || 'Street Food',
      type: 'craving',
      createdAt: c.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] Error fetching cravings:', err);
    return MOCK_CRAVINGS;
  }
}

export async function createCraving(craving: Partial<Review>): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase.from('cravings').insert({
      id: craving.id || `crav-${Date.now()}`,
      user_id: craving.userId,
      user_name: craving.userName,
      user_photo: craving.userPhoto,
      restaurant_name: craving.restaurantName,
      dish_name: craving.attachedDish || craving.restaurantName,
      video_url: craving.videoUrl,
      city: craving.city || 'Hyderabad',
      content: craving.content || '',
      dishes: craving.dishes || [],
      likes: 0,
      craving_tag: craving.cravingTag || 'Street Food',
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  } catch (err) {
    console.warn('[Supabase] Error creating craving in Supabase:', err);
  }
}

// ----------------------------------------------------------------------------
// 4. RESTAURANTS & DISHES
// ----------------------------------------------------------------------------

export async function getRestaurants(): Promise<Restaurant[]> {
  if (!isSupabaseConfigured) return DEFAULT_FALLBACK_RESTAURANTS;

  try {
    const { data, error } = await supabase.from('restaurants').select('*').limit(50);
    if (error) throw error;
    if (!data || data.length === 0) return DEFAULT_FALLBACK_RESTAURANTS;

    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      location: r.location,
      city: r.city,
      rating: Number(r.rating) || 4.5,
      reviewCount: r.review_count || 0,
      image: r.image,
      priceLevel: r.price_level,
      hours: r.hours,
      signatureDish: r.signature_dish,
      lat: r.lat ? Number(r.lat) : undefined,
      lng: r.lng ? Number(r.lng) : undefined
    }));
  } catch (err) {
    return DEFAULT_FALLBACK_RESTAURANTS;
  }
}

export async function getDishes(): Promise<DishEntity[]> {
  if (!isSupabaseConfigured) return MOCK_DISHES;

  try {
    const { data, error } = await supabase.from('dishes').select('*').limit(50);
    if (error) throw error;
    if (!data || data.length === 0) return MOCK_DISHES;

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      cuisine: d.category || 'Specialty',
      category: d.category,
      image: d.image,
      madeaterScore: Number(d.madeater_score) || 9.0,
      description: d.description || '',
      reviewCount: 150,
      tags: ['Popular', 'Signature'],
      ratings: { taste: 9.3, spice: 8.5, portion: 9.0, value: 8.9 },
      topRestaurants: []
    }));
  } catch (err) {
    return MOCK_DISHES;
  }
}

// ----------------------------------------------------------------------------
// 5. FOOD LISTS
// ----------------------------------------------------------------------------

export async function getLists(): Promise<FoodList[]> {
  if (!isSupabaseConfigured) return MOCK_LISTS;

  try {
    const { data, error } = await supabase.from('lists').select('*').limit(30);
    if (error) throw error;
    if (!data || data.length === 0) return MOCK_LISTS;

    return data.map((l: any) => ({
      id: l.id,
      userId: l.user_id,
      userName: l.user_name || 'Food Critic',
      userPhoto: l.user_photo,
      title: l.title,
      description: l.description,
      coverImage: l.cover_image,
      items: l.items || [],
      likes: l.likes || 0,
      isPrivate: l.is_private || false,
      createdAt: l.created_at
    }));
  } catch (err) {
    return MOCK_LISTS;
  }
}

// ----------------------------------------------------------------------------
// 6. SOCIAL INTERACTIONS (LIKES & REALTIME)
// ----------------------------------------------------------------------------

export async function toggleLike(targetId: string, targetType: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('target_id', targetId)
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      // Remove like
      await supabase.from('likes').delete().eq('id', data.id);
      return false;
    } else {
      // Add like
      await supabase.from('likes').insert({
        id: `like-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        target_id: targetId,
        target_type: targetType,
        user_id: userId
      });
      return true;
    }
  } catch (err) {
    console.warn('[Supabase] toggleLike error:', err);
    return true;
  }
}

// ----------------------------------------------------------------------------
// 7. MEDIA STORAGE UPLOAD
// ----------------------------------------------------------------------------

export async function uploadMedia(file: File | Blob, bucket: string = 'dish-media'): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    const { data, error } = await supabase.storage.from(bucket).upload(filename, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('[Supabase] Storage upload failed:', err);
    return null;
  }
}
