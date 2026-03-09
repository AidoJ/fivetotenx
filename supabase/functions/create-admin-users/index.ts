import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { password } = await req.json();
    if (!password) {
      return new Response(JSON.stringify({ error: "Password required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const users = [
      { email: "eoghan@5to10x.app", password },
      { email: "aidan@5to10x.app", password },
    ];

    const results = [];
    for (const user of users) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const exists = existingUsers?.users?.find(u => u.email === user.email);
      
      if (exists) {
        results.push({ email: user.email, status: "already exists" });
        continue;
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (error) {
        results.push({ email: user.email, status: "error", message: error.message });
      } else {
        results.push({ email: user.email, status: "created", id: data.user.id });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
