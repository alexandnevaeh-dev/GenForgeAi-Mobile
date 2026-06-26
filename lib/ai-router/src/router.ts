import { openrouter } from "@workspace/integrations-openrouter-ai";
import type OpenAI from "openai";
import { MODEL_CHAINS, type TaskType } from "./models";

export type { TaskType };

export interface RouteOptions {
  maxTokens?: number;
  temperature?: number;
  retryDelayMs?: number;
}

export interface RouteResult {
  content: string;
  model: string;
  taskType: TaskType;
  attemptCount: number;
}

export interface StreamEvent {
  content?: string;
  done?: boolean;
  error?: string;
  model?: string;
}

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_RETRY_DELAY = 800;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("rate limit") ||
      msg.includes("overloaded") ||
      msg.includes("timeout") ||
      msg.includes("503") ||
      msg.includes("502") ||
      msg.includes("529") ||
      msg.includes("insufficient_quota") ||
      msg.includes("context length")
    );
  }
  return true;
}

/**
 * Route a task to the best available free model, with automatic fallback.
 * Tries each model in the chain's priority order until one succeeds.
 */
export async function routeTask(
  task: TaskType,
  messages: OpenAI.ChatCompletionMessageParam[],
  options: RouteOptions = {}
): Promise<RouteResult> {
  const chain = MODEL_CHAINS[task];
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const retryDelay = options.retryDelayMs ?? DEFAULT_RETRY_DELAY;

  let lastError: unknown;
  let attemptCount = 0;

  for (const model of chain.models) {
    attemptCount++;
    try {
      const response = await openrouter.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages,
      });
      const content = response.choices[0]?.message?.content ?? "";
      return { content, model, taskType: task, attemptCount };
    } catch (err) {
      lastError = err;
      if (isRetryableError(err) && attemptCount < chain.models.length) {
        await sleep(retryDelay * attemptCount);
        continue;
      }
      break;
    }
  }

  const errMsg =
    lastError instanceof Error ? lastError.message : "All models failed";
  throw new Error(`[AI Router] Task "${task}" failed after ${attemptCount} attempts: ${errMsg}`);
}

/**
 * Stream a task through the best available model, with automatic fallback.
 * Calls onChunk for each streamed token. Falls back to next model on error.
 */
export async function streamTask(
  task: TaskType,
  messages: OpenAI.ChatCompletionMessageParam[],
  onChunk: (event: StreamEvent) => void,
  options: RouteOptions = {}
): Promise<{ model: string; attemptCount: number }> {
  const chain = MODEL_CHAINS[task];
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const retryDelay = options.retryDelayMs ?? DEFAULT_RETRY_DELAY;

  let lastError: unknown;
  let attemptCount = 0;

  for (const model of chain.models) {
    attemptCount++;
    try {
      const stream = await openrouter.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk({ content });
        }
      }

      onChunk({ done: true, model });
      return { model, attemptCount };
    } catch (err) {
      lastError = err;
      if (isRetryableError(err) && attemptCount < chain.models.length) {
        await sleep(retryDelay * attemptCount);
        continue;
      }
      break;
    }
  }

  const errMsg =
    lastError instanceof Error ? lastError.message : "All models failed";
  onChunk({ error: errMsg });
  throw new Error(`[AI Router] Stream "${task}" failed after ${attemptCount} attempts: ${errMsg}`);
}

/**
 * Describe which models would be used for a task (for debugging/analytics).
 */
export function getModelChain(task: TaskType) {
  return MODEL_CHAINS[task];
}
