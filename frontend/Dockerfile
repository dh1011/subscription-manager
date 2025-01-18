# Use an official Node.js image to build the app
FROM node:18-alpine as build

# Set the working directory
WORKDIR /app

# Declare the build argument
ARG REACT_APP_API_URL

# Set it as an environment variable
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app files
COPY . .

# Build the React app
RUN npm run build

# Use a smaller Node.js image for serving the app
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install a lightweight HTTP server for serving static files
RUN npm install -g serve

# Copy the build output from the previous stage
COPY --from=build /app/build ./build

# Expose the port for the HTTP server
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "build", "-l", "3000"]
