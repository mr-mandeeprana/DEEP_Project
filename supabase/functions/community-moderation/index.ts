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
      case "report_post":
        const { postId, reason, details } = await req.json();
        return await reportPost(supabaseClient, user.id, postId, reason, details);
      case "moderate_post":
        const { action: moderationAction, postId: modPostId, reason: modReason } = await req.json();
        return await moderatePost(supabaseClient, user.id, moderationAction, modPostId, modReason);
      case "get_reported_posts":
        return await getReportedPosts(supabaseClient);
      case "get_moderation_stats":
        return await getModerationStats(supabaseClient);
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
    console.error("Error in community-moderation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function reportPost(supabaseClient: any, userId: string, postId: string, reason: string, details?: string) {
  // Check if user already reported this post
  const { data: existingReport } = await supabaseClient
    .from("post_reports")
    .select("id")
    .eq("post_id", postId)
    .eq("reporter_id", userId)
    .single();

  if (existingReport) {
    return new Response(
      JSON.stringify({ error: "You have already reported this post" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { data, error } = await supabaseClient
    .from("post_reports")
    .insert({
      post_id: postId,
      reporter_id: userId,
      reason: reason,
      details: details,
      status: "pending"
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, report: data }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function moderatePost(supabaseClient: any, userId: string, action: string, postId: string, reason?: string) {
  // Check if user has moderation permissions (admin/superadmin)
  const { data: userProfile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!userProfile || !["admin", "superadmin", "moderator"].includes(userProfile.role)) {
    return new Response(
      JSON.stringify({ error: "Insufficient permissions" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const updateData: any = {
    moderated_at: new Date().toISOString(),
    moderated_by: userId,
    moderation_reason: reason
  };

  switch (action) {
    case "approve":
      updateData.status = "approved";
      updateData.moderation_action = "approved";
      break;
    case "hide":
      updateData.status = "hidden";
      updateData.moderation_action = "hidden";
      break;
    case "delete":
      updateData.status = "deleted";
      updateData.moderation_action = "deleted";
      break;
    default:
      return new Response(
        JSON.stringify({ error: "Invalid moderation action" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
  }

  const { data, error } = await supabaseClient
    .from("community_posts")
    .update(updateData)
    .eq("id", postId)
    .select()
    .single();

  if (error) throw error;

  // Update report status if this was from a report
  await supabaseClient
    .from("post_reports")
    .update({
      status: action,
      resolved_at: new Date().toISOString(),
      resolved_by: userId
    })
    .eq("post_id", postId);

  return new Response(
    JSON.stringify({ success: true, post: data }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function getReportedPosts(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from("post_reports")
    .select(`
      *,
      community_posts (
        id,
        title,
        content,
        user_id,
        created_at,
        profiles!fk_community_posts_user_id (display_name)
      ),
      reporter:profiles!fk_post_reports_reporter_id (display_name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ reports: data }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function getModerationStats(supabaseClient: any) {
  const [reportsResult, actionsResult, postsResult] = await Promise.all([
    supabaseClient.from("post_reports").select("id", { count: "exact", head: true }),
    supabaseClient.from("post_reports").select("status").neq("pending", "pending"),
    supabaseClient.from("community_posts").select("status").in("status", ["hidden", "deleted"])
  ]);

  const stats = {
    totalReports: reportsResult.count || 0,
    pendingReports: actionsResult.filter((r: any) => r.status === "pending").length,
    resolvedReports: actionsResult.filter((r: any) => r.status !== "pending").length,
    hiddenPosts: postsResult.filter((p: any) => p.status === "hidden").length,
    deletedPosts: postsResult.filter((p: any) => p.status === "deleted").length
  };

  return new Response(
    JSON.stringify(stats),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}