import express from "express";
import { getLatestEmail } from "../Controllers/emailController.js";

const router = express.Router();

router.get("/latest-email", getLatestEmail);

export default router;
