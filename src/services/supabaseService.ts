import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../supabase';
import { User, Review, Restaurant, DishEntity, FoodList, AppNotification } from '../types';
import { MOCK_DISHES } from '../data/mockData';
import { GLOBAL_RESTAURANTS } from '../data/globalRestaurants';

const DEFAULT_FALLBACK_RESTAURANTS: Restaurant[] = GLOBAL_RESTAURANTS;

// ============================================================================
// 1. SUPABASE AUTHENTICATION API
// ============================================================================

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        full_name: displayName
      }
    }
  });
  if (error) throw error;

  // Auto-provision profile row in public.profiles
  if (data.user) {
    await ensureProfile(data.user.id, displayName, undefined, email);
  }
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogleOAuth() {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.madeater.in';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
  if (error) throw error;
  return data;
}

export async function signOutUser(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.warn('[Supabase Auth] SignOut warning:', error.message);
}

export async function resetUserPassword(email: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/app/profile` : 'https://www.madeater.in/app/profile';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  });
  if (error) throw error;
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentSupabaseUser() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onSupabaseAuthStateChange(callback: (event: string, session: any) => void) {
  if (!isSupabaseConfigured) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}

// ============================================================================
// 2. PROFILES & USERS
// ============================================================================

export async function getProfile(idOrUsername: string): Promise<User | null> {
  if (!isSupabaseConfigured || !idOrUsername) return null;

  try {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', idOrUsername)
      .maybeSingle();

    if (!data) {
      const res = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', idOrUsername)
        .maybeSingle();
      data = res.data;
      error = res.error;
    }

    if (error) throw error;
    if (!data) return null;

    return {
      uid: data.id,
      displayName: data.display_name,
      username: data.username,
      email: data.email,
      photoURL: data.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.id}`,
      bio: data.bio,
      pronouns: data.pronouns,
      favoriteCuisines: data.favorite_cuisines || [],
      criticLevel: data.critic_level || 'Foodie',
      credibilityScore: data.credibility_score ?? 50,
      isVerifiedCritic: data.is_verified_critic || false,
      tasteDNA: data.taste_dna || {
        spice: 60,
        indian: 75,
        nonVeg: 50,
        asian: 40,
        desserts: 50,
        coffee: 70,
        personaTitle: 'The Flavor Explorer'
      },
      stats: data.stats || {
        mealsLogged: 0,
        reviewsWritten: 0,
        followers: 0,
        following: 0,
        followingList: []
      },
      createdAt: data.created_at
    };
  } catch (err) {
    console.warn('[Supabase] Failed to fetch profile:', err);
    return null;
  }
}

export async function upsertProfile(user: Partial<User>): Promise<void> {
  if (!isSupabaseConfigured || !user.uid) return;

  try {
    const updatePayload: Record<string, any> = {
      id: user.uid,
      updated_at: new Date().toISOString()
    };

    if (user.displayName !== undefined) updatePayload.display_name = user.displayName;
    if (user.username !== undefined) updatePayload.username = user.username;
    if (user.email !== undefined) updatePayload.email = user.email;
    if (user.photoURL !== undefined) updatePayload.photo_url = user.photoURL;
    if (user.bio !== undefined) updatePayload.bio = user.bio;
    if (user.pronouns !== undefined) updatePayload.pronouns = user.pronouns;
    if (user.favoriteCuisines !== undefined) updatePayload.favorite_cuisines = user.favoriteCuisines;
    if (user.criticLevel !== undefined) updatePayload.critic_level = user.criticLevel;
    if (user.credibilityScore !== undefined) updatePayload.credibility_score = user.credibilityScore;
    if (user.isVerifiedCritic !== undefined) updatePayload.is_verified_critic = user.isVerifiedCritic;
    if (user.tasteDNA !== undefined) updatePayload.taste_dna = user.tasteDNA;
    if (user.stats !== undefined) updatePayload.stats = user.stats;

    const { error } = await supabase.from('profiles').upsert(updatePayload);
    if (error) throw error;
  } catch (err) {
    console.warn('[Supabase] Error upserting profile:', err);
  }
}

export async function ensureProfile(userId: string, userName?: string, userPhoto?: string, email?: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  try {
    const cleanUsername = `critic_${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          display_name: userName || 'Food Critic',
          photo_url: userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
          username: cleanUsername,
          email: email || '',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.warn('[Supabase] Profile ensure notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase] Profile ensure notice:', err);
  }
}

export async function getTopCritics(limit = 20): Promise<User[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('credibility_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.map((d: any) => ({
      uid: d.id,
      displayName: d.display_name || 'Critic',
      username: d.username,
      email: d.email,
      photoURL: d.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.id}`,
      bio: d.bio,
      pronouns: d.pronouns,
      criticLevel: d.critic_level || 'Foodie',
      credibilityScore: d.credibility_score ?? 50,
      isVerifiedCritic: d.is_verified_critic || false,
      tasteDNA: d.taste_dna,
      stats: d.stats || { mealsLogged: 0, reviewsWritten: 0, followers: 0, following: 0 },
      createdAt: d.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] Failed to get top critics:', err);
    return [];
  }
}

export async function searchProfiles(queryText: string): Promise<User[]> {
  if (!isSupabaseConfigured || !queryText.trim()) return [];

  try {
    const term = `%${queryText.trim()}%`;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.${term},username.ilike.${term}`)
      .limit(15);

    if (error) throw error;
    if (!data) return [];

    return data.map((d: any) => ({
      uid: d.id,
      displayName: d.display_name,
      username: d.username,
      photoURL: d.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.id}`,
      criticLevel: d.critic_level,
      credibilityScore: d.credibility_score,
      isVerifiedCritic: d.is_verified_critic,
      stats: d.stats || { mealsLogged: 0, reviewsWritten: 0, followers: 0, following: 0 }
    }));
  } catch (err) {
    console.warn('[Supabase] Error searching profiles:', err);
    return [];
  }
}

export async function toggleFollow(
  currentUserId: string,
  targetUserId: string,
  isCurrentlyFollowing: boolean,
  actorInfo?: { name?: string; photo?: string }
): Promise<boolean> {
  if (!isSupabaseConfigured || !currentUserId || !targetUserId) return !isCurrentlyFollowing;

  try {
    const currentUser = await getProfile(currentUserId);
    const targetUser = await getProfile(targetUserId);
    if (!currentUser || !targetUser) return !isCurrentlyFollowing;

    const currentFollowingList: string[] = currentUser.stats?.followingList || [];
    let updatedFollowingList: string[];
    let newFollowersCount = targetUser.stats?.followers || 0;
    let newFollowingCount = currentUser.stats?.following || 0;

    if (isCurrentlyFollowing) {
      updatedFollowingList = currentFollowingList.filter(id => id !== targetUserId);
      newFollowingCount = Math.max(0, newFollowingCount - 1);
      newFollowersCount = Math.max(0, newFollowersCount - 1);

      await supabase
        .from('notifications')
        .delete()
        .eq('recipient_id', targetUserId)
        .eq('sender_id', currentUserId)
        .eq('type', 'FOLLOW');
    } else {
      updatedFollowingList = Array.from(new Set([...currentFollowingList, targetUserId]));
      newFollowingCount = newFollowingCount + 1;
      newFollowersCount = newFollowersCount + 1;

      await supabase
        .from('notifications')
        .insert({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          recipient_id: targetUserId,
          sender_id: currentUserId,
          sender_name: actorInfo?.name || currentUser.displayName || 'Critic',
          sender_photo: actorInfo?.photo || currentUser.photoURL || '',
          type: 'FOLLOW',
          is_read: false,
          created_at: new Date().toISOString()
        });
    }

    await upsertProfile({
      uid: currentUserId,
      stats: {
        ...currentUser.stats,
        following: newFollowingCount,
        followingList: updatedFollowingList
      }
    });

    await upsertProfile({
      uid: targetUserId,
      stats: {
        ...targetUser.stats,
        followers: newFollowersCount
      }
    });

    return !isCurrentlyFollowing;
  } catch (err) {
    console.error('[Supabase] toggleFollow error:', err);
    return isCurrentlyFollowing;
  }
}

// ============================================================================
// 3. REVIEWS & MEAL LOGS
// ============================================================================

export async function getReviews(restaurantId?: string, limit = 50): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || 'Food Critic',
      userPhoto: r.user_photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.user_id}`,
      userCriticLevel: r.user_critic_level || 'Foodie',
      restaurantId: r.restaurant_id || 'rest-unknown',
      restaurantName: r.restaurant_name || 'Specialty Spot',
      restaurantLocation: r.restaurant_location || r.city || 'Hyderabad',
      city: r.city || 'Hyderabad',
      dishes: r.dishes || [],
      rating: Number(r.rating) || 8.5,
      content: r.content || '',
      videoUrl: r.video_url,
      likes: r.likes || 0,
      type: r.type || 'review',
      ratingsDetail: r.ratings_detail,
      isVerifiedVisit: r.is_verified_visit || false,
      visitProofType: r.visit_proof_type || 'self',
      attachedDish: r.attached_dish,
      attachedCuisine: r.attached_cuisine,
      attachedScore: r.attached_score ? Number(r.attached_score) : undefined,
      cravingTag: r.craving_tag,
      createdAt: r.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] Error fetching reviews:', err);
    return [];
  }
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userPhoto: r.user_photo,
      userCriticLevel: r.user_critic_level,
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant_name,
      restaurantLocation: r.restaurant_location,
      city: r.city,
      dishes: r.dishes || [],
      rating: Number(r.rating) || 8.5,
      content: r.content,
      videoUrl: r.video_url,
      likes: r.likes || 0,
      type: r.type || 'review',
      ratingsDetail: r.ratings_detail,
      isVerifiedVisit: r.is_verified_visit,
      visitProofType: r.visit_proof_type,
      attachedDish: r.attached_dish,
      attachedCuisine: r.attached_cuisine,
      attachedScore: r.attached_score ? Number(r.attached_score) : undefined,
      cravingTag: r.craving_tag,
      createdAt: r.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] Error fetching user reviews:', err);
    return [];
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
    attachedDish: review.attachedDish,
    attachedCuisine: review.attachedCuisine,
    attachedScore: review.attachedScore,
    cravingTag: review.cravingTag,
    type: review.type || 'review',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      if (newReview.userId && newReview.userId !== 'anonymous') {
        await ensureProfile(newReview.userId, newReview.userName, newReview.userPhoto);
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
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
          attached_dish: newReview.attachedDish,
          attached_cuisine: newReview.attachedCuisine,
          attached_score: newReview.attachedScore,
          craving_tag: newReview.cravingTag,
          created_at: newReview.createdAt
        });

      if (error) {
        console.warn('[Supabase] Insert review warning:', error.message);
      }
    } catch (err) {
      console.warn('[Supabase] Failed to write review:', err);
    }
  }

  return newReview;
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !reviewId) return false;

  try {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Error deleting review:', err);
    return false;
  }
}

export function subscribeToReviews(callback: (reviews: Review[]) => void) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} };
  }

  // Initial load
  getReviews().then(callback);

  // Realtime subscription
  const channel = supabase
    .channel('public:reviews_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
      getReviews().then(callback);
    })
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

// ============================================================================
// 4. CRAVINGS (SHORT-FORM VIDEO REELS)
// ============================================================================

export async function getCravings(limit = 50): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('cravings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      userName: c.user_name || 'Food Critic',
      userPhoto: c.user_photo,
      restaurantId: 'crav-rest',
      restaurantName: c.restaurant_name,
      attachedDish: c.dish_name,
      city: c.city || 'Hyderabad',
      videoUrl: c.video_url,
      content: c.content || '',
      dishes: c.dishes || [{ name: c.dish_name || 'Food Item', rating: 5 }],
      rating: 9.5,
      attachedScore: 9.5,
      likes: c.likes || 0,
      cravingTag: c.craving_tag || 'Street Food',
      type: 'craving' as const,
      createdAt: c.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] Error fetching cravings:', err);
    return [];
  }
}

export async function createCraving(craving: Partial<Review>): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    if (craving.userId) {
      await ensureProfile(craving.userId, craving.userName, craving.userPhoto);
    }

    const dishName =
      craving.attachedDish ||
      (craving.dishes && craving.dishes[0]?.name) ||
      craving.restaurantName ||
      'Food Item';

    const { error } = await supabase
      .from('cravings')
      .insert({
        id: craving.id || `crav-${Date.now()}`,
        user_id: craving.userId,
        user_name: craving.userName,
        user_photo: craving.userPhoto,
        restaurant_name: craving.restaurantName,
        dish_name: dishName,
        video_url: craving.videoUrl,
        city: craving.city || 'Hyderabad',
        content: craving.content || '',
        dishes: craving.dishes || [{ name: dishName, rating: 5 }],
        likes: 0,
        craving_tag: craving.cravingTag || 'Street Food',
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (err) {
    console.error('[Supabase] Error creating craving:', err);
    throw err;
  }
}

export async function deleteCraving(cravingId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !cravingId) return false;

  try {
    const { error } = await supabase.from('cravings').delete().eq('id', cravingId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Error deleting craving:', err);
    return false;
  }
}

export function subscribeToCravings(callback: (cravings: Review[]) => void) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} };
  }

  // Initial load
  getCravings().then(callback);

  // Realtime subscription
  const channel = supabase
    .channel('public:cravings_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cravings' }, () => {
      getCravings().then(callback);
    })
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

// ============================================================================
// 5. RESTAURANTS & DISHES
// ============================================================================

export async function getRestaurants(city?: string, limit = 60): Promise<Restaurant[]> {
  if (!isSupabaseConfigured) {
    return DEFAULT_FALLBACK_RESTAURANTS;
  }

  try {
    let query = supabase.from('restaurants').select('*').limit(limit);
    if (city && city !== 'All') {
      query = query.ilike('city', `%${city}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return DEFAULT_FALLBACK_RESTAURANTS;
    }

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
    console.warn('[Supabase] Error fetching restaurants:', err);
    return DEFAULT_FALLBACK_RESTAURANTS;
  }
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  if (!isSupabaseConfigured || !id) {
    return DEFAULT_FALLBACK_RESTAURANTS.find(r => r.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      return {
        id: data.id,
        name: data.name,
        cuisine: data.cuisine,
        location: data.location,
        city: data.city,
        rating: Number(data.rating) || 4.5,
        reviewCount: data.review_count || 0,
        image: data.image,
        priceLevel: data.price_level,
        hours: data.hours,
        signatureDish: data.signature_dish,
        lat: data.lat ? Number(data.lat) : undefined,
        lng: data.lng ? Number(data.lng) : undefined
      };
    }
    return DEFAULT_FALLBACK_RESTAURANTS.find(r => r.id === id) || null;
  } catch {
    return DEFAULT_FALLBACK_RESTAURANTS.find(r => r.id === id) || null;
  }
}

export async function searchRestaurants(queryText: string): Promise<Restaurant[]> {
  if (!isSupabaseConfigured || !queryText.trim()) return [];

  try {
    const term = `%${queryText.trim()}%`;
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .or(`name.ilike.${term},cuisine.ilike.${term},location.ilike.${term},city.ilike.${term}`)
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) {
      return DEFAULT_FALLBACK_RESTAURANTS.filter(r =>
        r.name.toLowerCase().includes(queryText.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(queryText.toLowerCase())
      );
    }

    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      location: r.location,
      city: r.city,
      rating: Number(r.rating) || 4.5,
      reviewCount: r.review_count || 0,
      image: r.image
    }));
  } catch {
    return DEFAULT_FALLBACK_RESTAURANTS.filter(r =>
      r.name.toLowerCase().includes(queryText.toLowerCase())
    );
  }
}

export async function upsertRestaurant(restaurant: {
  id: string;
  name: string;
  cuisine?: string;
  location?: string;
  city?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  priceLevel?: string;
  lat?: number;
  lng?: number;
  menuItems?: string[];
}): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const payload: any = {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine || 'Various',
      location: restaurant.location || 'Unknown',
      city: restaurant.city || (restaurant.location ? restaurant.location.split(',').pop()?.trim() : 'Unknown'),
      rating: restaurant.rating || 4.5,
      review_count: restaurant.reviewCount || 0,
      image: restaurant.image || '',
      price_level: restaurant.priceLevel || '₹₹',
      lat: restaurant.lat,
      lng: restaurant.lng
    };

    const { error } = await supabase
      .from('restaurants')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Error upserting restaurant:', error);
    }
  } catch (err) {
    console.warn('[Supabase] Error in upsertRestaurant:', err);
  }
}

export async function getDishes(limit = 50): Promise<DishEntity[]> {
  if (!isSupabaseConfigured) {
    return MOCK_DISHES;
  }

  try {
    const { data, error } = await supabase.from('dishes').select('*').limit(limit);
    if (error) throw error;
    if (!data || data.length === 0) {
      return MOCK_DISHES;
    }

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
    console.warn('[Supabase] Error fetching dishes:', err);
    return MOCK_DISHES;
  }
}

// ============================================================================
// 6. FOOD LISTS
// ============================================================================

export async function getLists(userId?: string, limit = 30): Promise<FoodList[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase.from('lists').select('*').limit(limit);
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('is_private', false).order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

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
    console.warn('[Supabase] Error fetching lists:', err);
    return [];
  }
}

export async function getListById(id: string): Promise<FoodList | null> {
  if (!isSupabaseConfigured || !id) return null;

  try {
    const { data, error } = await supabase.from('lists').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name || 'Food Critic',
      userPhoto: data.user_photo,
      title: data.title,
      description: data.description,
      coverImage: data.cover_image,
      items: data.items || [],
      likes: data.likes || 0,
      isPrivate: data.is_private || false,
      createdAt: data.created_at
    };
  } catch (err) {
    console.warn('[Supabase] Error getting list by ID:', err);
    return null;
  }
}

export async function createList(list: Partial<FoodList>): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const id = list.id || `list-${Date.now()}`;
    const { error } = await supabase.from('lists').insert({
      id,
      user_id: list.userId,
      user_name: list.userName,
      user_photo: list.userPhoto,
      title: list.title,
      description: list.description,
      cover_image: list.coverImage,
      items: list.items || [],
      likes: 0,
      is_private: list.isPrivate || false,
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return id;
  } catch (err) {
    console.error('[Supabase] Error creating list:', err);
    return null;
  }
}

export async function updateList(id: string, updates: Partial<FoodList>): Promise<boolean> {
  if (!isSupabaseConfigured || !id) return false;

  try {
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.coverImage !== undefined) payload.cover_image = updates.coverImage;
    if (updates.items !== undefined) payload.items = updates.items;
    if (updates.isPrivate !== undefined) payload.is_private = updates.isPrivate;

    const { error } = await supabase.from('lists').update(payload).eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Error updating list:', err);
    return false;
  }
}

export async function deleteList(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !id) return false;

  try {
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Error deleting list:', err);
    return false;
  }
}

// ============================================================================
// 7. SOCIAL INTERACTIONS (LIKES, COMMENTS, NOTIFICATIONS)
// ============================================================================

export const toggleSupabaseFollow = toggleFollow;

export async function toggleLike(targetId: string, targetType: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !targetId || !userId) return true;

  try {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('target_id', targetId)
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      await supabase.from('likes').delete().eq('id', data.id);
      return false;
    } else {
      await supabase.from('likes').insert({
        id: `like-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        target_id: targetId,
        target_type: targetType,
        user_id: userId,
        created_at: new Date().toISOString()
      });
      return true;
    }
  } catch (err) {
    console.warn('[Supabase] toggleLike error:', err);
    return true;
  }
}

export async function toggleSupabaseLike(
  targetId: string,
  userId: string,
  _isCurrentlyLiked?: boolean,
  _actorInfo?: { name?: string; photo?: string }
): Promise<boolean> {
  return toggleLike(targetId, 'review', userId);
}

export async function getComments(targetId: string): Promise<any[]> {
  if (!isSupabaseConfigured || !targetId) return [];

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((c: any) => ({
      id: c.id,
      targetId: c.target_id,
      reviewId: c.target_id,
      targetType: c.target_type || 'review',
      userId: c.user_id,
      userName: c.user_name || 'Critic',
      userPhoto: c.user_photo,
      text: c.text,
      content: c.text,
      type: 'COMMENT',
      createdAt: c.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] Error getting comments:', err);
    return [];
  }
}

export async function addComment(comment: {
  targetId?: string;
  targetType?: string;
  reviewId?: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text?: string;
  content?: string;
}): Promise<any | null> {
  const targetId = comment.targetId || comment.reviewId;
  const targetType = comment.targetType || 'review';
  const text = comment.text || comment.content;
  if (!isSupabaseConfigured || !text?.trim() || !targetId) return null;

  try {
    const id = `comm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newComment = {
      id,
      target_id: targetId,
      target_type: targetType,
      user_id: comment.userId,
      user_name: comment.userName,
      user_photo: comment.userPhoto || '',
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('comments').insert(newComment);
    if (error) throw error;

    return {
      id,
      targetId,
      reviewId: targetId,
      targetType,
      userId: comment.userId,
      userName: comment.userName,
      userPhoto: comment.userPhoto,
      text: text.trim(),
      content: text.trim(),
      type: 'COMMENT',
      createdAt: newComment.created_at
    };
  } catch (err) {
    console.error('[Supabase] Error adding comment:', err);
    return null;
  }
}

export async function getNotifications(recipientId: string): Promise<AppNotification[]> {
  if (!isSupabaseConfigured || !recipientId) return [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    if (!data) return [];

    return data.map((n: any) => ({
      id: n.id,
      recipientId: n.recipient_id,
      actorId: n.sender_id || '',
      actorName: n.sender_name || 'Food Critic',
      actorPhoto: n.sender_photo || '',
      type: (n.type?.toUpperCase() || 'LIKE') as any,
      targetId: n.target_id,
      read: n.is_read || false,
      createdAt: n.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] Error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!isSupabaseConfigured || !id) return;
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Error marking notification read:', err);
  }
}

export function subscribeToNotifications(recipientId: string, callback: (notifications: AppNotification[]) => void) {
  if (!isSupabaseConfigured || !recipientId) {
    return { unsubscribe: () => {} };
  }

  getNotifications(recipientId).then(callback);

  const channel = supabase
    .channel(`public:notifications_${recipientId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${recipientId}`
      },
      () => {
        getNotifications(recipientId).then(callback);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}


// ============================================================================
// 8. MEDIA STORAGE UPLOAD (SUPABASE STORAGE)
// ============================================================================

export async function uploadMedia(
  file: File | Blob,
  bucket: 'dishes' | 'cravings' | 'profiles' | 'dish-media' | string = 'dishes',
  customPath?: string,
  onProgress?: (pct: number, loaded?: number, total?: number) => void
): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase Storage] Supabase is not configured');
    return null;
  }

  try {
    // Determine extension
    let extension = 'jpg';
    if (file instanceof File && file.name) {
      const parts = file.name.split('.');
      if (parts.length > 1) {
        extension = parts.pop()?.toLowerCase() || 'jpg';
      }
    } else if (file.type) {
      if (file.type.includes('mp4')) extension = 'mp4';
      else if (file.type.includes('webm')) extension = 'webm';
      else if (file.type.includes('mov')) extension = 'mov';
      else if (file.type.includes('png')) extension = 'png';
      else if (file.type.includes('webp')) extension = 'webp';
      else if (file.type.includes('jpeg') || file.type.includes('jpg')) extension = 'jpg';
    }

    // Clean path (strip bucket prefix if provided)
    let cleanPath = customPath || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${extension}`;
    if (cleanPath.startsWith(`${bucket}/`)) {
      cleanPath = cleanPath.slice(bucket.length + 1);
    }

    const total = file.size;
    console.log('[Supabase Storage] Upload started', {
      bucket,
      path: cleanPath,
      sizeMB: (total / (1024 * 1024)).toFixed(2),
      type: file.type
    });

    onProgress?.(0, 0, total);

    // 1. In browser environments: Use XMLHttpRequest for real-time byte progress & high speed
    if (typeof XMLHttpRequest !== 'undefined' && supabaseUrl && supabaseAnonKey) {
      const xhrUpload = new Promise<string | null>((resolve) => {
        try {
          const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${cleanPath}`;
          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadUrl, true);
          xhr.setRequestHeader('apikey', supabaseAnonKey);
          xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
          xhr.setRequestHeader('x-upsert', 'true');
          const mimeType = file.type || (extension === 'mp4' ? 'video/mp4' : extension === 'mov' ? 'video/quicktime' : 'application/octet-stream');
          xhr.setRequestHeader('Content-Type', mimeType);

          // 0 = no timeout: lets large uploads finish over any connection speed
          xhr.timeout = 0;

          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (evt) => {
              if (evt.lengthComputable && evt.total > 0) {
                const pct = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
                onProgress(pct, evt.loaded, evt.total);
              }
            };
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
              onProgress?.(100, total, total);
              console.log('[Supabase Storage] XHR upload complete:', publicUrl);
              resolve(publicUrl);
            } else {
              console.warn(`[Supabase Storage] XHR returned ${xhr.status}. Trying SDK fallback.`);
              resolve(null);
            }
          };

          xhr.onerror = () => {
            console.warn('[Supabase Storage] XHR network error. Trying SDK fallback.');
            resolve(null);
          };

          xhr.ontimeout = () => {
            console.warn('[Supabase Storage] XHR upload timed out.');
            resolve(null);
          };

          xhr.send(file);
        } catch (err) {
          console.warn('[Supabase Storage] Error initiating XHR upload:', err);
          resolve(null);
        }
      });

      const xhrResult = await xhrUpload;
      if (xhrResult) return xhrResult;
    }

    // 2. Fallback using Supabase JS client
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(cleanPath, file, {
        cacheControl: '31536000',
        contentType: file.type || undefined,
        upsert: true
      });

    if (error) {
      console.error('[Supabase Storage] Fallback upload failed:', error.message);
      return null;
    }

    onProgress?.(100, total, total);
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.error('[Supabase Storage] Unexpected upload error:', error);
    return null;
  }
}

export async function submitDeletionRequest(data: { email: string; username?: string; reason?: string; userId?: string }): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('deletion_requests').insert({
        email: data.email.trim().toLowerCase(),
        username: data.username?.trim().toLowerCase() || null,
        reason: data.reason || "User requested via web portal",
        user_id: data.userId || null,
        status: "pending"
      });
    } catch (e) {
      console.warn('[Supabase] Deletion request error:', e);
    }
  }
}