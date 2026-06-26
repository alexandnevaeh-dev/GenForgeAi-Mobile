import { Router, type IRouter } from "express";
import aiTasksRouter from "./ai-tasks";
import assetsRouter from "./assets";
import authRouter from "./auth";
import chatRouter from "./chat";
import exportRouter from "./export";
import generateRouter from "./generate";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import memoryRouter from "./memory";
import projectsRouter from "./projects";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(projectsRouter);
router.use(aiTasksRouter);
router.use(assetsRouter);
router.use(chatRouter);
router.use(generateRouter);
router.use(exportRouter);
router.use(jobsRouter);
router.use(memoryRouter);

export default router;
