import { Router, type IRouter } from "express";
import aiTasksRouter from "./ai-tasks";
import authRouter from "./auth";
import healthRouter from "./health";
import projectsRouter from "./projects";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(projectsRouter);
router.use(aiTasksRouter);

export default router;
