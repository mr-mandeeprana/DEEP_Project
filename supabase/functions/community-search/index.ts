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
      case "search_posts":
        const searchParams = await req.json();
        return await searchPosts(supabaseClient, user.id, searchParams);
      case "filter_posts":
        const filterParams = await req.json();
        return await filterPosts(supabaseClient, user.id, filterParams);
      case "get_trending_tags":
        return await getTrendingTags(supabaseClient);
      case "autocomplete_search":
        const query = url.searchParams.get("q");
        return await autocompleteSearch(supabaseClient, query);
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
    console.error("Error in community-search:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function searchPosts(supabaseClient: any, userId: string, searchParams: any) {
  const { query, tags, postType, author, dateFrom, dateTo, sortBy = "relevance", page = 1, limit = 20 } = searchParams;
  const offset = (page - 1) * limit;

  let searchQuery = supabaseClient
    .from("community_posts")
    .select(`
      *,
      profiles!fk_community_posts_user_id (display_name, avatar_url),
      post_likes!inner(count),
      comments!inner(count)
    `)
    .neq("status", "hidden")
    .neq("status", "deleted");

  // Text search
  if (query) {
    searchQuery = searchQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
  }

  // Filter by tags
  if (tags && tags.length > 0) {
    searchQuery = searchQuery.overlaps("tags", tags);
  }

  // Filter by post type
  if (postType) {
    searchQuery = searchQuery.eq("post_type", postType);
  }

  // Filter by author
  if (author) {
    const { data: authorData } = await supabaseClient
      .from("profiles")
      .select("id")
      .ilike("display_name", `%${author}%`)
      .single();

    if (authorData) {
      searchQuery = searchQuery.eq("user_id", authorData.id);
    }
  }

  // Date range filter
  if (dateFrom) {
    searchQuery = searchQuery.gte("created_at", dateFrom);
  }
  if (dateTo) {
    searchQuery = searchQuery.lte("created_at", dateTo);
  }

  // Sorting
  switch (sortBy) {
    case "newest":
      searchQuery = searchQuery.order("created_at", { ascending: false });
      break;
    case "oldest":
      searchQuery = searchQuery.order("created_at", { ascending: true });
      break;
    case "most_liked":
      searchQuery = searchQuery.order("likes_count", { ascending: false });
      break;
    case "most_commented":
      searchQuery = searchQuery.order("(select count(*) from comments where post_id = community_posts.id)", { ascending: false });
      break;
    case "relevance":
    default:
      // For relevance, we'll sort by a combination of factors
      searchQuery = searchQuery.order("likes_count", { ascending: false });
      break;
  }

  const { data: posts, error } = await searchQuery
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Calculate search relevance scores
  const scoredPosts = posts.map((post: any) => {
    let relevanceScore = 0;

    if (query) {
      const titleMatches = (post.title || "").toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const contentMatches = (post.content || "").toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      relevanceScore = (titleMatches * 2) + contentMatches;
    }

    relevanceScore += post.likes_count || 0;
    relevanceScore += (post.comments_count || 0) * 0.5;

    return {
      ...post,
      relevance_score: relevanceScore,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0
    };
  });

  if (sortBy === "relevance") {
    scoredPosts.sort((a: any, b: any) => b.relevance_score - a.relevance_score);
  }

  return new Response(
    JSON.stringify({
      posts: scoredPosts,
      page,
      limit,
      hasMore: posts.length === limit,
      totalResults: scoredPosts.length
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function filterPosts(supabaseClient: any, userId: string, filterParams: any) {
  const { tags, postType, author, dateRange, engagementLevel, page = 1, limit = 20 } = filterParams;
  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("community_posts")
    .select(`
      *,
      profiles!fk_community_posts_user_id (display_name, avatar_url),
      post_likes!inner(count),
      comments!inner(count)
    `)
    .neq("status", "hidden")
    .neq("status", "deleted");

  // Tags filter
  if (tags && tags.length > 0) {
    query = query.overlaps("tags", tags);
  }

  // Post type filter
  if (postType) {
    query = query.eq("post_type", postType);
  }

  // Author filter
  if (author) {
    const { data: authorData } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("display_name", author)
      .single();

    if (authorData) {
      query = query.eq("user_id", authorData.id);
    }
  }

  // Date range filter
  if (dateRange) {
    const now = new Date();
    let dateFrom: Date;

    switch (dateRange) {
      case "today":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(dateRange);
    }

    query = query.gte("created_at", dateFrom.toISOString());
  }

  // Engagement level filter
  if (engagementLevel) {
    const minLikes = getEngagementThreshold(engagementLevel);
    query = query.gte("likes_count", minLikes);
  }

  query = query.order("created_at", { ascending: false });

  const { data: posts, error } = await query
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return new Response(
    JSON.stringify({
      posts: posts.map((post: any) => ({
        ...post,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0
      })),
      page,
      limit,
      hasMore: posts.length === limit
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

function getEngagementThreshold(level: string): number {
  switch (level) {
    case "low": return 0;
    case "medium": return 5;
    case "high": return 20;
    case "viral": return 100;
    default: return 0;
  }
}

async function getTrendingTags(supabaseClient: any) {
  // Get tags from posts in the last 7 days, ordered by frequency
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabaseClient
    .from("community_posts")
    .select("tags")
    .gte("created_at", sevenDaysAgo)
    .neq("status", "hidden")
    .neq("status", "deleted");

  if (error) throw error;

  const tagCounts: { [key: string]: number } = {};

  posts.forEach((post: any) => {
    if (post.tags) {
      post.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const trendingTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  return new Response(
    JSON.stringify({ trendingTags }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function autocompleteSearch(supabaseClient: any, query: string | null) {
  if (!query || query.length < 2) {
    return new Response(
      JSON.stringify({ suggestions: [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Search for matching post titles
  const { data: titleSuggestions } = await supabaseClient
    .from("community_posts")
    .select("title")
    .ilike("title", `%${query}%`)
    .neq("status", "hidden")
    .neq("status", "deleted")
    .limit(5);

  // Search for matching authors
  const { data: authorSuggestions } = await supabaseClient
    .from("profiles")
    .select("display_name")
    .ilike("display_name", `%${query}%`)
    .limit(5);

  // Search for matching tags
  const { data: postsWithTags } = await supabaseClient
    .from("community_posts")
    .select("tags")
    .neq("status", "hidden")
    .neq("status", "deleted");

  const tagSuggestions: string[] = [];
  postsWithTags.forEach((post: any) => {
    if (post.tags) {
      post.tags.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query!.toLowerCase()) && !tagSuggestions.includes(tag)) {
          tagSuggestions.push(tag);
        }
      });
    }
  });

  const suggestions = {
    posts: titleSuggestions?.map((p: any) => ({ type: "post", value: p.title })) || [],
    authors: authorSuggestions?.map((a: any) => ({ type: "author", value: a.display_name })) || [],
    tags: tagSuggestions.slice(0, 5).map((tag: string) => ({ type: "tag", value: tag }))
  };

  return new Response(
    JSON.stringify({ suggestions }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}