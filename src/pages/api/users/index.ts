// src/pages/api/users/index.ts
import type { APIRoute } from "astro";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { user } from "@lib/server/db/schema";

type UserRole = "user" | "admin" | "super_admin";
type CursorPayload = { createdAtMs: number; id: string };

function encodeCursor(payload: CursorPayload): string {
  return btoa(JSON.stringify(payload));
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const raw = atob(cursor);
    const obj = JSON.parse(raw);
    const createdAtMs = Number(obj?.createdAtMs);
    const id = String(obj?.id ?? "");
    if (!Number.isFinite(createdAtMs) || !id) return null;
    return { createdAtMs, id };
  } catch {
    return null;
  }
}

function escapeLike(input: string) {
  return input
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

function toMs(v: unknown): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return NaN;
}

export const GET: APIRoute = async (context) => {
  const db = context.locals.db;
  const url = new URL(context.request.url);

  const limitRaw = Number(url.searchParams.get("limit") ?? "15");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 100)
    : 15;

  const q = (url.searchParams.get("q") ?? "").trim();
  const role = (url.searchParams.get("role") ?? "").trim() as UserRole | "";
  const pageCursor = url.searchParams.get("cursor") ?? "";
  const cursor = pageCursor ? decodeCursor(pageCursor) : null;

  const where: any[] = [];

  if (role === "user" || role === "admin" || role === "super_admin") {
    where.push(eq(user.role, role));
  }

  if (q) {
    const like = `%${escapeLike(q)}%`;
    where.push(
      or(
        sql`${user.email} LIKE ${like} ESCAPE '\\'`,
        sql`${user.name} LIKE ${like} ESCAPE '\\'`,
      ),
    );
  }

  // IMPORTANT: createdAt is mode:"timestamp" => compare with Date values
  if (cursor) {
    const cursorDate = new Date(cursor.createdAtMs);
    where.push(
      or(
        lt(user.createdAt, cursorDate),
        and(eq(user.createdAt, cursorDate), lt(user.id, cursor.id)),
      ),
    );
  }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(user.createdAt), desc(user.id))
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const pageRows = hasNext ? rows.slice(0, limit) : rows;

  const last = pageRows[pageRows.length - 1];

  const nextCursor =
    hasNext && last
      ? encodeCursor({
          createdAtMs: toMs(last.createdAt),
          id: String(last.id),
        })
      : null;

  return new Response(
    JSON.stringify({ users: pageRows, nextCursor, pageCursor }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
