import { describe, it, expect, vi } from "vitest";
import { createIdempotentJob } from "@/lib/generation/idempotency";

function fakeSupabase(existingJob: Record<string, unknown> | null) {
  const insert = vi.fn(() => ({
    select: () => ({
      single: async () => {
        if (existingJob) {
          return { data: null, error: { code: "23505", message: "duplicate key" } };
        }
        return { data: { id: "job-1", idempotency_key: "abc" }, error: null };
      },
    }),
  }));

  const eqCalls: unknown[] = [];
  const select = vi.fn(() => ({
    eq: (...args: unknown[]) => {
      eqCalls.push(args);
      return {
        eq: () => ({
          single: async () => ({ data: existingJob, error: null }),
        }),
      };
    },
  }));

  return {
    from: () => ({ insert, select }),
    __insert: insert,
  };
}

describe("createIdempotentJob", () => {
  it("tworzy nowy job, gdy klucz idempotencji jest unikalny", async () => {
    const supabase = fakeSupabase(null);
    const result = await createIdempotentJob(supabase as never, {
      workspace_id: "ws",
      idempotency_key: "abc",
    } as never);
    expect(result.alreadyExisted).toBe(false);
    expect(result.job.id).toBe("job-1");
    expect(supabase.__insert).toHaveBeenCalledTimes(1);
  });

  it("przy podwójnym tapnięciu (ten sam klucz) zwraca ISTNIEJĄCY job zamiast tworzyć nowy płatny request", async () => {
    const existing = { id: "job-existing", idempotency_key: "abc" };
    const supabase = fakeSupabase(existing);
    const result = await createIdempotentJob(supabase as never, {
      workspace_id: "ws",
      idempotency_key: "abc",
    } as never);
    expect(result.alreadyExisted).toBe(true);
    expect(result.job.id).toBe("job-existing");
    // Insert było wywołane raz (próba), ale NIE powstał drugi wiersz — select po duplikacie
    // zwraca ten sam job, więc żadna druga płatna generacja nie zostanie uruchomiona.
    expect(supabase.__insert).toHaveBeenCalledTimes(1);
  });
});
