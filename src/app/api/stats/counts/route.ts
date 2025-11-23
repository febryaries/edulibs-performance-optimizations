import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Cache pentru a evita query-uri multiple
let cachedCounts: {
  resources: number;
  groups: number;
  users: number;
} | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minute

// Flag pentru a preveni multiple query-uri simultane la prima încărcare
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export async function GET() {
  try {
    const now = Date.now();

    // Returnează din cache dacă e valid
    if (cachedCounts && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedCounts,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000),
      });
    }

    // Dacă un alt request deja refreshează, așteaptă rezultatul
    if (isRefreshing && refreshPromise) {
      await refreshPromise;
      // După ce se termină refresh-ul, returnează din cache
      if (cachedCounts) {
        return NextResponse.json({
          ...cachedCounts,
          cached: true,
          cacheAge: Math.floor((Date.now() - cacheTimestamp) / 1000),
        });
      }
    }

    // Marchează că începem refresh-ul
    isRefreshing = true;

    const supabase = await createClient();

    // Verificăm dacă utilizatorul e autentificat
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[API] No authenticated user - returning cached or 0");
      isRefreshing = false;
      refreshPromise = null;
      // Returnează cache-ul vechi sau 0
      return NextResponse.json(
        cachedCounts || { resources: 0, groups: 0, users: 0, cached: false },
        { status: 200 }
      );
    }

    // Facem toate count-urile în paralel (mai rapid decât secvențial)
    refreshPromise = Promise.all([
      supabase.from("resources").select("*", { count: "exact", head: true }),
      supabase.from("groups").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
    ]);

    const [resourcesResult, groupsResult, usersResult] = await refreshPromise;

    // DEBUG: Log toate rezultatele pentru a vedea exact ce primim
    console.log("[API] Resources result:", {
      count: resourcesResult.count,
      error: resourcesResult.error,
      status: resourcesResult.status,
      statusText: resourcesResult.statusText,
    });
    console.log("[API] Groups result:", {
      count: groupsResult.count,
      error: groupsResult.error,
      status: groupsResult.status,
      statusText: groupsResult.statusText,
    });
    console.log("[API] Users result:", {
      count: usersResult.count,
      error: usersResult.error,
      status: usersResult.status,
      statusText: usersResult.statusText,
    });

    const counts = {
      resources: resourcesResult.count || 0,
      groups: groupsResult.count || 0,
      users: usersResult.count || 0,
    };

    console.log("[API] Final counts:", counts);

    // Actualizează cache-ul
    cachedCounts = counts;
    cacheTimestamp = now;
    isRefreshing = false;
    refreshPromise = null;

    return NextResponse.json({
      ...counts,
      cached: false,
      cacheAge: 0,
    });
  } catch (error) {
    console.error("[API] Error fetching counts:", error);
    // Returnează cache-ul vechi dacă există, altfel 0
    return NextResponse.json(
      cachedCounts || { resources: 0, groups: 0, users: 0, cached: false },
      { status: 500 }
    );
  }
}
