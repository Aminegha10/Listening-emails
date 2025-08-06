import { google } from "googleapis";
import { oauth2Client } from "../server.js";

export const getLatestEmail = async (req, res) => {
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
};
