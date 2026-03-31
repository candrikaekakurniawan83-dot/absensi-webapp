import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import documentsRouter from "./documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(documentsRouter);

export default router;
