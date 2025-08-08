import { google } from "googleapis";
import logger from "../utils/logger.js";  // Adjust the path as needed

export default function startPolling(oauth2Client) {
  // Parse the email body to extract structured info
  function parseEmailBody(body) {
    const lines = body.split("\n").map((line) => line.trim());
    const data = {
      orderNumber: null,
      salesAgent: null,
      orderDate: null,
      notes: [],
    };

    let readingNotes = false;

    for (const line of lines) {
      if (line.startsWith("*رقم الطلب:*")) {
        data.orderNumber = line.replace("*رقم الطلب:*", "").trim();
        readingNotes = false;
      } else if (line.startsWith("*اسم ممثل المبيعات:*")) {
        data.salesAgent = line.replace("*اسم ممثل المبيعات:*", "").trim();
        readingNotes = false;
      } else if (line.startsWith("*تاريخ الطلب:*")) {
        data.orderDate = line.replace("*تاريخ الطلب:*", "").trim();
        readingNotes = false;
      } else if (line.startsWith("*ملاحظات:*")) {
        readingNotes = true; // The following lines are notes/products
      } else if (readingNotes && line.length > 0) {
        data.notes.push(line);
      }
    }

    return data;
  }

  async function pollLatestEmail() {
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const query =
        'is:unread subject:"إعداد الطلبية رقم" from:"preparateur magasin"';

      const messagesRes = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 5,
      });

      if (!messagesRes.data.messages || messagesRes.data.messages.length === 0) {
        logger.info("No unread matching emails found.");
        return;
      }

      // Fetch full message details and mark as read
      const emails = await Promise.all(
        messagesRes.data.messages.map(async (message) => {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full",
          });

          await gmail.users.messages.modify({
            userId: "me",
            id: message.id,
            requestBody: {
              removeLabelIds: ["UNREAD"],
            },
          });

          const messageData = msg.data;
          const headers = messageData.payload.headers;

          function getHeader(headers, name) {
            const header = headers.find(
              (h) => h.name.toLowerCase() === name.toLowerCase()
            );
            return header ? header.value : null;
          }

          function decodeBase64Url(encodedStr) {
            const buff = Buffer.from(encodedStr, "base64");
            return buff.toString("utf-8");
          }

          const from = getHeader(headers, "From");
          const to = getHeader(headers, "To");
          const subject = getHeader(headers, "Subject");
          const date = getHeader(headers, "Date");
          const snippet = messageData.snippet;

          let body = null;
          if (messageData.payload.parts) {
            const plainTextPart = messageData.payload.parts.find(
              (part) => part.mimeType === "text/plain"
            );
            if (plainTextPart && plainTextPart.body && plainTextPart.body.data) {
              body = decodeBase64Url(plainTextPart.body.data);
            }
          } else if (messageData.payload.body && messageData.payload.body.data) {
            body = decodeBase64Url(messageData.payload.body.data);
          }

          const parsedBody = parseEmailBody(body || "");

          // Detailed info to console (no change)
          console.log('--- New Email ---');
          console.log(`From: ${from}`);
          console.log(`To: ${to}`);
          console.log(`Subject: ${subject}`);
          console.log(`Date: ${new Date(date).toLocaleString()}`);
          console.log(`Snippet: ${snippet}`);
          console.log('\nParsed Details:');
          console.log(`Order Number: ${parsedBody.orderNumber}`);
          console.log(`Sales Agent: ${parsedBody.salesAgent}`);
          console.log(`Order Date: ${parsedBody.orderDate}`);
          console.log('Notes/Products:');
          if (parsedBody.notes.length > 0) {
            const header = parsedBody.notes[0];
            const dataLines = parsedBody.notes.slice(1);

            console.log(header);

            dataLines.forEach(line => {
              const parts = line.split(' ');
              if (parts.length < 4) {
                console.log(`  • ${line}`);
                return;
              }
              const storage = parts.pop();
              const barcode = parts.pop();
              const quantity = parts.pop();
              const productName = parts.join(' ');

              console.log(`  • Product Name: ${productName}, Quantity: ${quantity}, Barcode: ${barcode}, Storage: ${storage}`);
            });
          } else {
            console.log('  No notes or products listed.');
          }
          console.log('-----------------\n');

          return {
            id: message.id,
            from,
            to,
            subject,
            date: new Date(date).toISOString(),
            snippet,
            body,
            parsedBody,
          };
        })
      );

      logger.info(`Processed ${emails.length} email(s) successfully.`);
    } catch (error) {
      logger.error(`Failed to fetch unread filtered emails: ${error.message || error}`);
    }
  }

  setInterval(pollLatestEmail, 6000);
}
