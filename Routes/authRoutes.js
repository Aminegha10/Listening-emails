import express from "express";
import { auth, oauth2callback } from "../Controllers/authController.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.get("/auth", (req, res) => {
  logger.info("GET /auth called");
  auth(req, res);
});
router.get("/oauth2callback", (req, res) => {
  logger.info("GET /oauth2callback called");
  oauth2callback(req, res);
});

export default router;