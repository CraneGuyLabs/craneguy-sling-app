import express from "express";
import v1Router from "./api/v1";

const app = express();

// middleware
app.use(express.json());

// mount API
app.use("/api/v1", v1Router);

export default app;
