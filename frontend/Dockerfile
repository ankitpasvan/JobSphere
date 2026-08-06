# Stage 1: Build the React application with Vite
FROM node:18-alpine AS build
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm install

# Copy source and build static assets
COPY . .
RUN npm run build

# Stage 2: Serve the production build using Nginx
FROM nginx:alpine

# Copy build artifacts to Nginx's static file directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the standard HTTP port
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
