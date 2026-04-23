"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/notifications";

/**
 * Toggle follow status between current user and target user
 */
export async function toggleFollow(targetUserId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Anda harus masuk untuk mengikuti pengguna.");
  if (user.id === targetUserId) throw new Error("Anda tidak bisa mengikuti diri sendiri.");

  // Check if already following
  const { data: existing } = await supabase
    .from("user_follows")
    .select()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    // Unfollow
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);
    
    if (error) throw error;
  } else {
    // Follow
    const { error } = await supabase
      .from("user_follows")
      .insert({
        follower_id: user.id,
        following_id: targetUserId
      });
    
    if (error) throw error;

    // Send notification to target user
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    await sendNotification({
      userId: targetUserId,
      type: "social",
      title: "Pengikut Baru! 👋",
      message: `${profile?.full_name || profile?.username || "Seseorang"} mulai mengikuti Anda.`,
      link: `/profile?id=${user.id}`
    });
  }

  revalidatePath(`/profile`);
  return { success: true, isFollowing: !existing };
}

/**
 * Get followers list with pagination and follow status check
 */
export async function getFollowers(targetUserId: string, offset = 0, limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch followers
  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      follower:profiles!follower_id (id, full_name, username, avatar_url)
    `)
    .eq("following_id", targetUserId)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const followers = data.map((d: any) => d.follower);

  // Check if current user follows these followers
  if (currentUser && followers.length > 0) {
    const followerIds = followers.map((f: any) => f.id);
    const { data: followingStatus } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUser.id)
      .in("following_id", followerIds);

    const followingSet = new Set(followingStatus?.map(fs => fs.following_id));
    followers.forEach((f: any) => {
      f.is_following = followingSet.has(f.id);
    });
  }

  return followers;
}

/**
 * Get following list with pagination and follow status check
 */
export async function getFollowing(targetUserId: string, offset = 0, limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch following
  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      following:profiles!following_id (id, full_name, username, avatar_url)
    `)
    .eq("follower_id", targetUserId)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const followingList = data.map((d: any) => d.following);

  // Check if current user follows these people
  if (currentUser && followingList.length > 0) {
    const followingIds = followingList.map((f: any) => f.id);
    const { data: followingStatus } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUser.id)
      .in("following_id", followingIds);

    const followingSet = new Set(followingStatus?.map(fs => fs.following_id));
    followingList.forEach((f: any) => {
      f.is_following = followingSet.has(f.id);
    });
  }

  return followingList;
}

