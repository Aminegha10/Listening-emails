import express from "express";
import { google } from "googleapis";
import fs from "fs";

const app = express();
const port = 3000;

const tokensPath = "tokens.json";

// =====================
// OAuth2 Setup
// =====================s
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000/oauth2callback"
);

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
];

// Load tokens at server startup if available
if (fs.existsSync(tokensPath)) {
  const tokens = JSON.parse(fs.readFileSync(tokensPath));
  oauth2Client.setCredentials(tokens);
}

// =====================
// Auth Routes
// =====================

app.get("/auth", (req, res) => {
  if (oauth2Client.credentials.access_token) {
    return res.send("Already authenticated. Go to / to use the app.");
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(url);
});

app.get("/oauth2callback", async (req, res) => {
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
});

// =====================
// Gmail Latest Email Endpoint
// =====================

app.get("/latest-email", async (req, res) => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const messagesRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
    });
    const latestMessageId = messagesRes.data.messages?.[0]?.id;
    if (!latestMessageId) return res.send("No messages found.");

    const latestMessage = await gmail.users.messages.get({
      userId: "me",
      id: latestMessageId,
    });

    res.json(latestMessage.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch latest email");
  }
});

// =====================
// Home Route
// =====================

app.get("/", (req, res) => {
  res.send(`
    <h2>📩 Gmail Polling App</h2>
    <a href="/auth">Authenticate with Google</a><br>
    <a href="/latest-email">Get Latest Email</a>
  `);
});

// =====================
// Gmail Polling Logic
// =====================

let lastSeenMessageId = null;

async function pollLatestEmail() {
  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const messagesRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
    });

    const latestMessageId = messagesRes.data.messages?.[0]?.id;
    if (!latestMessageId) {
      console.log("No messages found.");
      return;
    }

    // If already seen, do nothing
    if (latestMessageId === lastSeenMessageId) return;

    lastSeenMessageId = latestMessageId;

    const latestMessage = await gmail.users.messages.get({
      userId: "me",
      id: latestMessageId,
    });

    const headers = latestMessage.data.payload?.headers || [];
    const subjectHeader = headers.find((h) => h.name === "Subject");
    const fromHeader = headers.find((h) => h.name === "From");

    const subject = subjectHeader?.value || "(No Subject)";
    const from = fromHeader?.value || "(Unknown Sender)";

    console.log(`📬 New Email!`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
  } catch (err) {
    console.error("Error polling Gmail:", err.message);
  }
}

// Poll every 5 seconds
setInterval(pollLatestEmail, 5000);

// =====================
// Start Server
// =====================

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
