import fs from "fs";
import { oauth2Client, SCOPES } from "../server.js";

const tokensPath = "tokens.json";

export const auth = (req, res) => {
  if (oauth2Client.credentials.access_token) {
    return res.send("Already authenticated. Go to / to use the app.");
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(url);
};

export const oauth2callback = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code parameter");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync(tokensPath, JSON.stringify(tokens));
    res.send(
      "Authentication successful! You can now close this tab and use the app."
    );
  } catch (error) {
    console.error("Error during OAuth callback", error);
    res.status(500).send("Authentication failed");
  }
};
