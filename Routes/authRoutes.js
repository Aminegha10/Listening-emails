import express from "express";
import { auth, oauth2callback } from "../Controllers/authController.js";

const router = express.Router();

router.get("/auth", auth);
router.get("/oauth2callback", oauth2callback);

export default router;
