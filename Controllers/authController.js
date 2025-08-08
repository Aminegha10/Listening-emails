import fs from "fs";
import { oauth2Client, SCOPES } from "../server.js";

const tokensPath = "tokens.json";

// Redirect user to Google Auth
export const auth = (req, res) => {
  if (oauth2Client.credentials.access_token) {
    return res.send("Already authenticated. Go to / to use the app.");
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensures refresh_token is returned at least once
    scope: SCOPES,
  });

  res.redirect(url);
};

// Handle callback after Google Auth
export const oauth2callback = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code parameter");

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Load existing tokens if available
    let savedTokens = {};
    if (fs.existsSync(tokensPath)) {
      savedTokens = JSON.parse(fs.readFileSync(tokensPath));
    }

    // Merge with existing refresh_token if not returned this time
    const updatedTokens = {
      ...savedTokens,
      ...tokens,
      refresh_token: tokens.refresh_token || savedTokens.refresh_token,
    };
    // if the access token is expired then it will be call the refresh with an api request
   //doing a manual check if acces token is expired and fetch the refrechtoken if you do a NON api google request

    // Set the full credentials to oauth2Client
    oauth2Client.setCredentials(updatedTokens);

    // Save updated tokens to file
    fs.writeFileSync(tokensPath, JSON.stringify(updatedTokens, null, 2));

    res.send("✅ Authentication successful! You can now close this tab and use the app.");
  } catch (error) {
    console.error("❌ Error during OAuth callback:", error);
    res.status(500).send("Authentication failed");
  }
};
