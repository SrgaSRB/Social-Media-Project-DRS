# Use Node.js image
FROM node:16-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all frontend files (excluding those in .dockerignore)
COPY . .

# Build the React app
RUN npm run build

# Expose the port React runs on (default is 3000)
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]
