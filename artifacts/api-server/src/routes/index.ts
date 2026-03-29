import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import chatRouter from "./chat";
import voiceRouter from "./voice";
import socialRouter from "./social";
import communityRouter from "./community";
import dmRouter from "./dm";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(chatRouter);
router.use(voiceRouter);
router.use(socialRouter);
router.use(communityRouter);
router.use(dmRouter);

export default router;
