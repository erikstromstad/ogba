export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // =========================
    // GET runs
    // =========================
    if (url.pathname === "/api/runs") {
      const runs = await env.DB.prepare(`
        SELECT 
          runs.id, 
          runs.start_time, 
          runs.max_players, 
          runs.notes,
          locations.name as location_name,
          locations.map_link,
          COUNT(registrations.id) as player_count
        FROM runs
        LEFT JOIN locations ON runs.location_id = locations.id
        LEFT JOIN registrations 
          ON runs.id = registrations.run_id 
          AND registrations.status = 'confirmed'
        WHERE runs.status = 'open'
        GROUP BY runs.id
        ORDER BY runs.start_time ASC
      `).all();

      return new Response(JSON.stringify(runs.results), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // =========================
    // GET players
    // =========================
    if (url.pathname === "/api/players") {
      const runId = url.searchParams.get("run_id");

      const players = await env.DB.prepare(`
        SELECT 
          players.name, 
          players.email, 
          registrations.status, 
          COALESCE(registrations.payment_status, 'unpaid') as payment_status,
          registrations.id as reg_id
        FROM registrations
        JOIN players ON players.id = registrations.player_id
        WHERE registrations.run_id = ?
        ORDER BY registrations.created_at ASC
      `).bind(runId).all();

      return new Response(JSON.stringify(players.results), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // =========================
    // POST signup
    // =========================
    if (url.pathname === "/api/signup" && request.method === "POST") {
      const { run_id, name, email } = await request.json();

      let existingPlayer = await env.DB.prepare(`
        SELECT id FROM players WHERE email = ?
      `).bind(email).first();

      let playerId;

      if (existingPlayer) {
        playerId = existingPlayer.id;
      } else {
        const player = await env.DB.prepare(`
          INSERT INTO players (name, email)
          VALUES (?, ?)
        `).bind(name, email).run();

        playerId = player.meta.last_row_id;
      }

      const countResult = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM registrations
        WHERE run_id = ? AND status = 'confirmed'
      `).bind(run_id).first();

      const run = await env.DB.prepare(`
        SELECT max_players FROM runs WHERE id = ?
      `).bind(run_id).first();

      let status = countResult.count >= run.max_players ? "waitlist" : "confirmed";

      await env.DB.prepare(`
        INSERT INTO registrations (run_id, player_id, status, payment_status)
        VALUES (?, ?, ?, 'unpaid')
      `).bind(run_id, playerId, status).run();

      return new Response(JSON.stringify({ status }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // =========================
    // UPDATE PAYMENT STATUS
    // =========================
    if (url.pathname === "/api/update-payment" && request.method === "POST") {
      const { reg_id, payment_status } = await request.json();

      await env.DB.prepare(`
        UPDATE registrations
        SET payment_status = ?
        WHERE id = ?
      `).bind(payment_status, reg_id).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // =========================
    // POST cancel (WITH WAITLIST PROMOTION 🔥)
    // =========================
    if (url.pathname === "/api/cancel" && request.method === "POST") {
      const { run_id, email } = await request.json();

      // 🔍 Find the registration being removed
      const existing = await env.DB.prepare(`
        SELECT registrations.id, registrations.status
        FROM registrations
        JOIN players ON players.id = registrations.player_id
        WHERE registrations.run_id = ?
        AND players.email = ?
      `).bind(run_id, email).first();

      if (existing) {
        // ❌ Remove the player
        await env.DB.prepare(`
          DELETE FROM registrations WHERE id = ?
        `).bind(existing.id).run();

        // 🔥 If they were CONFIRMED → promote next waitlist
        if (existing.status === "confirmed") {
          const next = await env.DB.prepare(`
            SELECT id
            FROM registrations
            WHERE run_id = ?
            AND status = 'waitlist'
            ORDER BY created_at ASC
            LIMIT 1
          `).bind(run_id).first();

          if (next) {
            await env.DB.prepare(`
              UPDATE registrations
              SET status = 'confirmed'
              WHERE id = ?
            `).bind(next.id).run();
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // =========================
    // CREATE RUN
    // =========================
if (url.pathname === "/api/create-run" && request.method === "POST") {
  const { datetime, location, max_players, notes } = await request.json();

  if (!datetime || typeof datetime !== "string" || !datetime.includes("T")) {
    return new Response(JSON.stringify({
      success: false,
      error: "Missing or invalid date/time"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  if (!location || typeof location !== "string") {
    return new Response(JSON.stringify({
      success: false,
      error: "Missing or invalid location"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  if (!max_players || Number(max_players) < 1) {
    return new Response(JSON.stringify({
      success: false,
      error: "Missing or invalid max players"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  const loc = await env.DB.prepare(`
    SELECT id FROM locations WHERE name = ?
  `).bind(location).first();

  if (!loc) {
    return new Response(JSON.stringify({
      success: false,
      error: "Invalid location"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  await env.DB.prepare(`
    INSERT INTO runs (location_id, start_time, max_players, notes)
    VALUES (?, ?, ?, ?)
  `).bind(loc.id, datetime, Number(max_players), notes || "").run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

    // =========================
    // UPDATE RUN
    // =========================
    if (url.pathname === "/api/update-run" && request.method === "POST") {
      const { id, datetime, location, max_players, notes } = await request.json();

      const loc = await env.DB.prepare(`
        SELECT id FROM locations WHERE name = ?
      `).bind(location).first();

      if (!loc) {
        return new Response(JSON.stringify({ success: false }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      await env.DB.prepare(`
        UPDATE runs
        SET location_id = ?, start_time = ?, max_players = ?, notes = ?
        WHERE id = ?
      `).bind(loc.id, datetime, max_players, notes || "", id).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // =========================
    // DELETE RUN
    // =========================
    if (url.pathname === "/api/delete-run" && request.method === "POST") {
      const { id } = await request.json();

      await env.DB.prepare(`
        DELETE FROM registrations WHERE run_id = ?
      `).bind(id).run();

      await env.DB.prepare(`
        DELETE FROM runs WHERE id = ?
      `).bind(id).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};