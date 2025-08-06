import { google } from "googleapis";

let lastSeenMessageId = null;

export default function startPolling(oauth2Client) {
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

  setInterval(pollLatestEmail, 5000);
}
