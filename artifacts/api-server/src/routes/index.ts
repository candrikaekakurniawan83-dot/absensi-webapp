import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import documentsRouter from "./documents";
import inventoryRouter from "./inventory";
import complaintsRouter from "./complaints";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(documentsRouter);
router.use(inventoryRouter);
router.use(complaintsRouter);

export default router;
