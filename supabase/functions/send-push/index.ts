// Supabase Edge Function: send-push
// Dispatches Firebase Cloud Messaging (FCM) push notifications to Android & iOS mobile devices
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, title, body, data } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing recipient FCM device token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serverKey = Deno.env.get("FIREBASE_SERVER_KEY") || Deno.env.get("FCM_SERVER_KEY");

    if (!serverKey) {
      console.warn("FIREBASE_SERVER_KEY / FCM_SERVER_KEY not set in Supabase Secrets.");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Set FIREBASE_SERVER_KEY in Supabase dashboard under Edge Function secrets." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via FCM Legacy / HTTP API
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${serverKey}`,
      },
      body: JSON.stringify({
        to: token,
        priority: "high",
        notification: {
          title: title || "New Message",
          body: body || "You have a new message on EatDxR",
          sound: "default",
          android_channel_id: "madeater_messages",
          icon: "ic_stat_icon_config_sample",
          color: "#F97316",
        },
        data: data || {},
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
