import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { AgentState } from "@/components/AgentNetwork";
import { AGENT_DEFS } from "@/constants/agents";
import { useAuth } from "./AuthContext";

export type GameGenre =
  | "RPG"
  | "Action"
  | "Platformer"
  | "Strategy"
  | "Puzzle"
  | "Horror"
  | "Adventure"
  | "Simulation"
  | "Fighting"
  | "Shooter";

export type ArtStyle =
  | "Pixel Art"
  | "Low Poly"
  | "Realistic"
  | "Cartoon"
  | "Isometric"
  | "Voxel"
  | "Anime";

export type ProjectStatus =
  | "planning"
  | "generating"
  | "in_progress"
  | "complete"
  | "exported";

export interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

export interface GameProject {
  id: string;
  title: string;
  description: string;
  genre: GameGenre;
  artStyle: ArtStyle;
  prompt: string;
  status: ProjectStatus;
  progress: number;
  createdAt: number;
  updatedAt: number;
  steps: GenerationStep[];
  agentStates: AgentState[];
  tags: string[];
}

// Shape returned by the API
interface ApiProject {
  id: string;
  title: string;
  description: string;
  genre: string;
  artStyle: string;
  status: string;
  progress: number;
  tags: string[] | null;
  storyData: Record<string, unknown> | null;
  agentStates: unknown;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsContextValue {
  projects: GameProject[];
  activeProject: GameProject | null;
  setActiveProject: (project: GameProject | null) => void;
  addProject: (project: GameProject) => Promise<GameProject>;
  updateProject: (id: string, updates: Partial<GameProject>) => void;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

const GUEST_STORAGE_KEY = "@genforge_projects_v3";

export const DEFAULT_STEPS: GenerationStep[] = [
  { id: "story", label: "Building World & Story", status: "pending" },
  { id: "design", label: "Designing Characters", status: "pending" },
  { id: "enemies", label: "Creating Enemies & Bosses", status: "pending" },
  { id: "combat", label: "Balancing Combat", status: "pending" },
  { id: "skills", label: "Creating Skill Trees", status: "pending" },
  { id: "levels", label: "Building Levels", status: "pending" },
  { id: "art", label: "Generating Pixel Art", status: "pending" },
  { id: "audio", label: "Creating Soundtrack", status: "pending" },
  { id: "package", label: "Packaging Project", status: "pending" },
];

export function makeInitialAgentStates(): AgentState[] {
  return AGENT_DEFS.map((a) => ({ agentId: a.id, status: "idle" as const }));
}

export function makeSeededAgentStates(progress: number): AgentState[] {
  const total = AGENT_DEFS.length;
  const doneCount = Math.floor((progress / 100) * total);
  return AGENT_DEFS.map((a, i) => ({
    agentId: a.id,
    status: i < doneCount ? ("done" as const) : ("idle" as const),
  }));
}

export function makeStepsFromProgress(progress: number): GenerationStep[] {
  const total = DEFAULT_STEPS.length;
  const doneCount = Math.floor((progress / 100) * total);
  return DEFAULT_STEPS.map((s, i) => ({
    ...s,
    status:
      i < doneCount
        ? ("done" as const)
        : i === doneCount && progress < 100
          ? ("active" as const)
          : ("pending" as const),
  }));
}

function apiToGame(p: ApiProject): GameProject {
  const storyData = (p.storyData ?? {}) as Record<string, unknown>;
  const rawAgentStates = p.agentStates;
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    genre: p.genre as GameGenre,
    artStyle: p.artStyle as ArtStyle,
    prompt: (storyData.prompt as string) ?? p.description,
    status: p.status as ProjectStatus,
    progress: p.progress,
    createdAt: new Date(p.createdAt).getTime(),
    updatedAt: new Date(p.updatedAt).getTime(),
    tags: p.tags ?? [],
    steps:
      (storyData.steps as GenerationStep[] | undefined) ??
      makeStepsFromProgress(p.progress),
    agentStates: Array.isArray(rawAgentStates)
      ? (rawAgentStates as AgentState[])
      : makeSeededAgentStates(p.progress),
  };
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  const [projects, setProjects] = useState<GameProject[]>([]);
  const [activeProject, setActiveProject] = useState<GameProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const authHeaders = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(tokenRef.current
        ? { Authorization: `Bearer ${tokenRef.current}` }
        : {}),
    }),
    []
  );

  // ── Guest: AsyncStorage ────────────────────────────────────────────────
  const persistGuest = useCallback((list: GameProject[]) => {
    AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(list));
  }, []);

  // ── Load projects ──────────────────────────────────────────────────────
  const refreshProjects = useCallback(async () => {
    if (isGuest) {
      const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        try {
          setProjects(JSON.parse(raw) as GameProject[]);
        } catch {
          setProjects([]);
        }
      } else {
        setProjects([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load projects");
      const data = (await res.json()) as { projects: ApiProject[] };
      setProjects(data.projects.map(apiToGame));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, authHeaders]);

  useEffect(() => {
    setIsLoading(true);
    refreshProjects();
  }, [refreshProjects]);

  // ── addProject ────────────────────────────────────────────────────────
  const addProject = useCallback(
    async (project: GameProject): Promise<GameProject> => {
      if (isGuest) {
        setProjects((prev) => {
          const next = [project, ...prev];
          persistGuest(next);
          return next;
        });
        return project;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          genre: project.genre,
          artStyle: project.artStyle,
          tags: project.tags,
          prompt: project.prompt,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error ?? "Failed to create project");
      }
      const data = (await res.json()) as { project: ApiProject };
      const created = apiToGame(data.project);
      // Merge client-side runtime state (steps, agentStates) that server doesn't have yet
      const merged: GameProject = {
        ...created,
        steps: project.steps,
        agentStates: project.agentStates,
        prompt: project.prompt,
      };
      setProjects((prev) => [merged, ...prev]);
      return merged;
    },
    [isGuest, authHeaders, persistGuest]
  );

  // ── updateProject ─────────────────────────────────────────────────────
  const updateProject = useCallback(
    (id: string, updates: Partial<GameProject>) => {
      // Always update local state immediately
      setProjects((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        );
        if (isGuest) persistGuest(next);
        return next;
      });

      // Sync "real" fields to server for authenticated users
      if (!isGuest) {
        const serverFields: Record<string, unknown> = {};
        if (updates.status !== undefined) serverFields.status = updates.status;
        if (updates.progress !== undefined)
          serverFields.progress = updates.progress;
        if (updates.title !== undefined) serverFields.title = updates.title;
        if (updates.description !== undefined)
          serverFields.description = updates.description;
        if (updates.tags !== undefined) serverFields.tags = updates.tags;

        if (Object.keys(serverFields).length > 0) {
          fetch(`/api/projects/${id}`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(serverFields),
          }).catch(() => {
            // silently ignore — local state already updated
          });
        }
      }
    },
    [isGuest, authHeaders, persistGuest]
  );

  // ── deleteProject ─────────────────────────────────────────────────────
  const deleteProject = useCallback(
    async (id: string) => {
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (isGuest) persistGuest(next);
        return next;
      });

      if (!isGuest) {
        await fetch(`/api/projects/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
      }
    },
    [isGuest, authHeaders, persistGuest]
  );

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        addProject,
        updateProject,
        deleteProject,
        refreshProjects,
        isLoading,
        error,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
