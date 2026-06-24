import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { AGENT_DEFS } from "@/constants/agents";
import { AgentState } from "@/components/AgentNetwork";

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

interface ProjectsContextValue {
  projects: GameProject[];
  activeProject: GameProject | null;
  setActiveProject: (project: GameProject | null) => void;
  addProject: (project: GameProject) => void;
  updateProject: (id: string, updates: Partial<GameProject>) => void;
  deleteProject: (id: string) => void;
  isLoading: boolean;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

const STORAGE_KEY = "@genforge_projects_v2";

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
    status: i < doneCount ? "done" : "idle",
  }));
}

const SEED_PROJECTS: GameProject[] = [
  {
    id: "proj_1",
    title: "Shadow Rift Chronicles",
    description:
      "A dark fantasy metroidvania with procedurally generated castles and deep lore.",
    genre: "Adventure",
    artStyle: "Pixel Art",
    prompt:
      "Create a dark fantasy metroidvania with procedurally generated castles.",
    status: "in_progress",
    progress: 67,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000,
    tags: ["dark fantasy", "metroidvania", "procedural"],
    steps: DEFAULT_STEPS.map((s, i) => ({
      ...s,
      status: i < 6 ? "done" : i === 6 ? "active" : "pending",
    })),
    agentStates: makeSeededAgentStates(67),
  },
  {
    id: "proj_2",
    title: "Neon Runners",
    description:
      "A cyberpunk endless runner with neon aesthetics and bullet-time mechanics.",
    genre: "Action",
    artStyle: "Low Poly",
    prompt: "Cyberpunk endless runner with neon aesthetics and bullet time.",
    status: "complete",
    progress: 100,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000,
    tags: ["cyberpunk", "runner", "neon"],
    steps: DEFAULT_STEPS.map((s) => ({ ...s, status: "done" as const })),
    agentStates: makeSeededAgentStates(100),
  },
];

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [activeProject, setActiveProject] = useState<GameProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as GameProject[];
          // Backfill agentStates for projects that don't have them
          const migrated = parsed.map((p) =>
            p.agentStates ? p : { ...p, agentStates: makeSeededAgentStates(p.progress) }
          );
          setProjects(migrated);
        } catch {
          setProjects(SEED_PROJECTS);
        }
      } else {
        setProjects(SEED_PROJECTS);
      }
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback((updated: GameProject[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addProject = useCallback(
    (project: GameProject) => {
      setProjects((prev) => {
        const next = [project, ...prev];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<GameProject>) => {
      setProjects((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
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
        isLoading,
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
