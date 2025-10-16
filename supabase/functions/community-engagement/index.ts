import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "track_engagement":
        const engagementData = await req.json();
        return await trackEngagement(supabaseClient, user.id, engagementData);
      case "get_user_feed":
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        return await getPersonalizedFeed(supabaseClient, user.id, page, limit);
      case "get_similar_posts":
        const postId = url.searchParams.get("postId");
        return await getSimilarPosts(supabaseClient, postId);
      case "update_reading_progress":
        const progressData = await req.json();
        return await updateReadingProgress(supabaseClient, user.id, progressData);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error in community-engagement:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function trackEngagement(supabaseClient: any, userId: string, engagementData: any) {
  const { postId, action, metadata } = engagementData;

  const { data, error } = await supabaseClient
    .from("user_engagement")
    .insert({
      user_id: userId,
      post_id: postId,
      action: action,
      metadata: metadata,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, engagement: data }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function getPersonalizedFeed(supabaseClient: any, userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  // Get user's interests and past engagement
  const { data: userInterests } = await supabaseClient
    .from("user_interests")
    .select("tags, categories")
    .eq("user_id", userId)
    .single();

  // Get user's recent engagement
  const { data: recentEngagement } = await supabaseClient
    .from("user_engagement")
    .select("post_id, action")
    .eq("user_id", userId)
    .gte("timestamp", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("timestamp", { ascending: false })
    .limit(50);

  // Build personalized query
  let query = supabaseClient
    .from("community_posts")
    .select(`
      *,
      profiles!fk_community_posts_user_id (display_name, avatar_url),
      post_likes!inner(count)
    `)
    .neq("user_id", userId) // Don't show user's own posts
    .neq("status", "hidden") // Don't show hidden posts
    .neq("status", "deleted") // Don't show deleted posts
    .order("created_at", { ascending: false });

  // Apply interest-based filtering
  if (userInterests?.tags?.length > 0) {
    query = query.overlaps("tags", userInterests.tags);
  }

  const { data: posts, error } = await query
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Calculate engagement scores for personalization
  const personalizedPosts = posts.map((post: any) => {
    let score = post.likes_count || 0;

    // Boost score based on user interests
    if (userInterests?.tags?.some((tag: string) => post.tags?.includes(tag))) {
      score *= 1.5;
    }

    // Boost score based on recent engagement with similar posts
    const similarEngagement = recentEngagement?.filter((eng: any) =>
      posts.some((p: any) => p.id === eng.post_id && p.tags?.some((tag: string) => post.tags?.includes(tag)))
    );

    if (similarEngagement?.length > 0) {
      score *= 1.2;
    }

    return {
      ...post,
      personalization_score: score,
      engagement_count: post.likes_count || 0
    };
  }).sort((a: any, b: any) => b.personalization_score - a.personalization_score);

  return new Response(
    JSON.stringify({
      posts: personalizedPosts,
      page,
      limit,
      hasMore: posts.length === limit
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function getSimilarPosts(supabaseClient: any, postId: string | null) {
  if (!postId) {
    return new Response(
      JSON.stringify({ error: "Post ID required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Get the original post
  const { data: originalPost, error: postError } = await supabaseClient
    .from("community_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postError) throw postError;

  // Find similar posts based on tags, post_type, and content similarity
  const { data: similarPosts, error } = await supabaseClient
    .from("community_posts")
    .select(`
      *,
      profiles!fk_community_posts_user_id (display_name, avatar_url)
    `)
    .neq("id", postId)
    .neq("status", "hidden")
    .neq("status", "deleted")
    .or(`post_type.eq.${originalPost.post_type},tags.overlaps.{${originalPost.tags?.join(',') || ''}}`)
    .order("likes_count", { ascending: false })
    .limit(10);

  if (error) throw error;

  return new Response(
    JSON.stringify({ posts: similarPosts, originalPost }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function updateReadingProgress(supabaseClient: any, userId: string, progressData: any) {
  const { postId, progress, completed } = progressData;

  const { data, error } = await supabaseClient
    .from("reading_progress")
    .upsert({
      user_id: userId,
      post_id: postId,
      progress: progress,
      completed: completed,
      last_read_at: new Date().toISOString()
    }, {
      onConflict: "user_id,post_id"
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, progress: data }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}