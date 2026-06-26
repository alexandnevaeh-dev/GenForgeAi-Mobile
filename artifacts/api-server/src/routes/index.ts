import { Router, type IRouter } from "express";
import aiTasksRouter from "./ai-tasks";
import assetsRouter from "./assets";
import authRouter from "./auth";
import chatRouter from "./chat";
import generateRouter from "./generate";
import healthRouter from "./health";
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

export default router;
