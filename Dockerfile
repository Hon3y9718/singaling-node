# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Expose the port your server runs on
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
