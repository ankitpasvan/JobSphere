# Use a stable Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the dependency manifests
COPY package*.json ./

# Install project dependencies
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Expose the API port
EXPOSE 5000

# Specify the runtime command to start the server
CMD ["node", "server.js"]
