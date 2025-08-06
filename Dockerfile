# Use official Node.js LTS image as base
FROM node:24.5-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose port your app listens to
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
