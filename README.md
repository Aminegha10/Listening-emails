# 📬 Listening Email App

A Node.js application that authenticates with Google via OAuth2, reads the latest Gmail messages using the Gmail API, and continuously polls for new emails.

## 🚀 Features

- Google OAuth2 Authentication
- Fetch latest Gmail message
- Poll Gmail inbox every 5 seconds
- Clean MVC structure (routes, controllers)
- Dockerized for deployment
- GitHub Actions for CI/CD to Docker Hub

---

## 🧰 Tech Stack

- Node.js + Express
- Google APIs (OAuth2 + Gmail)
- Docker
- GitHub Actions (CI/CD)
- JavaScript (ES Modules)

---

## 📂 Project Structure

├── Controllers
│ ├── authController.js
│ └── emailController.js
├── Routes
│ ├── authRoutes.js
│ └── emailRoutes.js
├── config
│ └── gmailPoller.js
├── .github/workflows
│ └── ci-cd.yml
├── Dockerfile
├── server.js
├── .env
└── tokens.json
---

## 🧪 Local Setup

```bash
git clone https://github.com/your-username/listening-email.git
cd listening-email
npm install
npm start

Visit http://localhost:3000 to authenticate.
````
## Docker Setup
Build and run the app using Docker:

bash
Copy
Edit
docker build -t listening-email .
docker run -p 3000:3000 listening-email

