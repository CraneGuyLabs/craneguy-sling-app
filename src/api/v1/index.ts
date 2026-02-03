import express from "express";
import slingRouter from "./sling/route";

const router = express.Router();

router.use("/sling", slingRouter);

export default router;
