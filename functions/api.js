// functions/api.js

// =========================
// AUTH CONFIG
// =========================
const VALID_USERNAME = "manager";
const VALID_PASSWORD = "Cat4log!@23";
const STATIC_TOKEN = "cm-demo-token";

// =========================
// IN-MEMORY DATA
// =========================
let actors = [
    { id: "a1", name: "Demo Actor 1" },
    { id: "a2", name: "Demo Actor 2" }
];

let events = [
    { id: "e1", title: "Demo Event 1", date: "2026-07-20" }
];

// =========================
// HELPERS
// =========================
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

function requireAuth(request) {
    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    return token === STATIC_TOKEN;
}

// =========================
// MAIN ROUTER
// =========================
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // =========================
    // LOGIN
    // =========================
    if (path === "/api/login" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { username, password } = body;

        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            return json({ ok: true, token: STATIC_TOKEN });
        }

        return json({ ok: false, error: "Invalid credentials" }, 401);
    }

    // =========================
    // AUTH REQUIRED BELOW
    // =========================
    if (!requireAuth(request)) {
        return json({ ok: false, error: "Unauthorized" }, 401);
    }

    // =========================
    // DASHBOARD
    // =========================
    if (path === "/api/dashboard" && method === "GET") {
        return json({
            ok: true,
            actorCount: actors.length,
            eventCount: events.length
        });
    }

    // =========================
    // ACTORS
    // =========================
    if (path === "/api/actors" && method === "GET") {
        return json({ ok: true, actors });
    }

    if (path === "/api/actors" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { name } = body;

        if (!name) {
            return json({ ok: false, error: "Name required" }, 400);
        }

        const id = "a" + Date.now().toString(36);
        const actor = { id, name };
        actors.push(actor);

        return json({ ok: true, actor });
    }

    if (path.startsWith("/api/actors/") && method === "DELETE") {
        const id = path.split("/").pop();
        actors = actors.filter(a => a.id !== id);
        return json({ ok: true });
    }

    // =========================
    // EVENTS
    // =========================
    if (path === "/api/events" && method === "GET") {
        return json({ ok: true, events });
    }

    if (path === "/api/events" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { title, date } = body;

        if (!title || !date) {
            return json({ ok: false, error: "Title and date required" }, 400);
        }

        const id = "e" + Date.now().toString(36);
        const ev = { id, title, date };
        events.push(ev);

        return json({ ok: true, event: ev });
    }

    // =========================
    // REPORTS
    // =========================
    if (path === "/api/reports" && method === "GET") {
        const totalActors = actors.length;
        const totalEvents = events.length;
        const avgActorsPerEvent =
            totalEvents === 0 ? 0 : (totalActors / totalEvents).toFixed(1);

        return json({
            ok: true,
            totalActors,
            actorNote: `Total actors currently in catalog: ${totalActors}.`,
            totalEvents,
            eventNote: `Total scheduled events: ${totalEvents}.`,
            avgActorsPerEvent,
            avgNote:
                totalEvents === 0
                    ? "No events yet, average is 0."
                    : `On average, ${avgActorsPerEvent} actors per event.`
        });
    }

    // =========================
    // FALLBACK
    // =========================
    return json({ ok: false, error: "Not found" }, 404);
}
