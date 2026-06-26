/**
 * Agent memory helpers.
 *
 * Memories are per-project, per-agent key/value pairs that survive across
 * generation runs. The generator writes key facts after each phase and reads
 * them at the start of the next run so agents have continuity.
 */

import { db } from "@workspace/db";
import { agentMemories } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";

export interface MemoryEntry {
  id: string;
  agent: string;
  key: string;
  value: string;
  phase: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Return all memory entries for a project, grouped by agent. */
export async function getProjectMemory(projectId: string): Promise<MemoryEntry[]> {
  return db
    .select()
    .from(agentMemories)
    .where(eq(agentMemories.projectId, projectId))
    .orderBy(agentMemories.phase, agentMemories.agent, agentMemories.key);
}

/** Upsert a memory entry (insert or replace by projectId + agent + key). */
export async function upsertMemory(opts: {
  projectId: string;
  ownerId: string;
  agent: string;
  key: string;
  value: string;
  phase?: number;
}): Promise<void> {
  const existing = await db
    .select({ id: agentMemories.id })
    .from(agentMemories)
    .where(
      and(
        eq(agentMemories.projectId, opts.projectId),
        eq(agentMemories.agent, opts.agent),
        eq(agentMemories.key, opts.key)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(agentMemories)
      .set({ value: opts.value, phase: opts.phase ?? 0, updatedAt: new Date() })
      .where(eq(agentMemories.id, existing[0]!.id));
  } else {
    await db.insert(agentMemories).values({
      projectId: opts.projectId,
      ownerId: opts.ownerId,
      agent: opts.agent,
      key: opts.key,
      value: opts.value,
      phase: opts.phase ?? 0,
    });
  }
}

/** Write multiple memory entries in one call (best-effort, non-blocking). */
export async function writeMemories(
  projectId: string,
  ownerId: string,
  phase: number,
  agent: string,
  entries: Record<string, string>
): Promise<void> {
  await Promise.allSettled(
    Object.entries(entries).map(([key, value]) =>
      upsertMemory({ projectId, ownerId, agent, key, value, phase })
    )
  );
}

/** Delete a single memory entry by id. */
export async function deleteMemory(id: string, projectId: string): Promise<boolean> {
  const result = await db
    .delete(agentMemories)
    .where(and(eq(agentMemories.id, id), eq(agentMemories.projectId, projectId)))
    .returning();
  return result.length > 0;
}

/** Delete all memories for a project (or a specific agent within the project). */
export async function clearMemory(projectId: string, agent?: string): Promise<number> {
  const condition = agent
    ? and(eq(agentMemories.projectId, projectId), eq(agentMemories.agent, agent))
    : eq(agentMemories.projectId, projectId);
  const result = await db.delete(agentMemories).where(condition).returning();
  return result.length;
}

/** Build a condensed memory context string to inject into AI prompts. */
export function buildMemoryContext(memories: MemoryEntry[]): string {
  if (memories.length === 0) return "";
  const byAgent: Record<string, string[]> = {};
  for (const m of memories) {
    (byAgent[m.agent] ??= []).push(`${m.key}: ${m.value}`);
  }
  const parts = Object.entries(byAgent).map(
    ([agent, lines]) => `[${agent}]\n${lines.join("\n")}`
  );
  return `\n\nProject memory from previous runs:\n${parts.join("\n\n")}`;
}
