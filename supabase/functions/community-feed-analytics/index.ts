import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
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
      case "get_feed_stats":
        return await getFeedStats(supabaseClient);
      case "get_trending_posts":
        return await getTrendingPosts(supabaseClient);
      case "get_user_engagement":
        return await getUserEngagement(supabaseClient, user.id);
      case "search_posts":
        const query = url.searchParams.get("q");
        return await searchPosts(supabaseClient, query);
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
    console.error("Error in community-feed-analytics:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getFeedStats(supabaseClient: any) {
  // Get overall community statistics
  const [postsResult, usersResult, engagementResult] = await Promise.all([
    supabaseClient.from("community_posts").select("id", { count: "exact", head: true }),
    supabaseClient.from("profiles").select("id", { count: "exact", head: true }),
    supabaseClient.from("post_likes").select("id", { count: "exact", head: true })
  ]);

  const stats = {
    totalPosts: postsResult.count || 0,
    totalUsers: usersResult.count || 0,
    totalLikes: engagementResult.count || 0,
    engagementRate: ((engagementResult.count || 0) / Math.max(postsResult.count || 1, 1) * 100).toFixed(1)
  };

  return new Response(
    JSON.stringify(stats),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function getTrendingPosts(supabaseClient: any) {
  // Get posts with highest engagement in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: posts, error } = await supabaseClient
    .from("community_posts")
    .select(`
      *,
      profiles!fk_community_posts_user_id (display_name, avatar_url),
      post_likes (count),
      post_comments (count)
    `)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("likes_count", { ascending: false })
    .limit(10);

  if (error) throw error;

  // Calculate trending score based on likes, comments, and recency
  const trendingPosts = posts.map((post: any) => {
    const daysSincePosted = (new Date().getTime() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 7 - daysSincePosted);
    const engagementScore = (post.likes_count || 0) * 2 + (post.comments_count || 0) * 3;
    const trendingScore = engagementScore * (1 + recencyScore / 7);

    return {
      ...post,
      trending_score: trendingScore,
      engagement_metrics: {
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        total_engagement: engagementScore
      }
    };
  }).sort((a: any, b: any) => b.trending_score - a.trending_score);

  return new Response(
    JSON.stringify(trendingPosts),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function getUserEngagement(supabaseClient: any, userId: string) {
  // Get user's engagement metrics
  const [userPosts, userLikes, userComments] = await Promise.all([
    supabaseClient.from("community_posts").select("id, likes_count, comments_count").eq("user_id", userId),
    supabaseClient.from("post_likes").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabaseClient.from("post_comments").select("id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  const totalUserLikes = userPosts.reduce((sum: number, post: any) => sum + (post.likes_count || 0), 0);
  const totalUserComments = userPosts.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0);

  const engagement = {
    postsCreated: userPosts.length,
    totalLikesReceived: totalUserLikes,
    totalCommentsReceived: totalUserComments,
    likesGiven: userLikes.count || 0,
    commentsGiven: userComments.count || 0,
    engagementScore: totalUserLikes * 2 + totalUserComments * 3
  };

  return new Response(
    JSON.stringify(engagement),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function searchPosts(supabaseClient: any, query: string | null) {
  if (!query || query.trim().length < 2) {
    return new Response(
      JSON.stringify({ posts: [], error: "Search query too short" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Search posts by title, content, tags, or author
  const { data: posts, error } = await supabaseClient
    .from("community_posts")
    .select(`
      *,
      profiles!fk_community_posts_user_id (display_name, avatar_url)
    `)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return new Response(
    JSON.stringify({ posts, query }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}