#!/bin/bash
# Run API tests against Docker container

CONTAINER_NAME="subscription-manager-final"
IMAGE_NAME="subscription-manager"

# Check if container is already running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Container $CONTAINER_NAME is already running."
else
    echo "Starting container $CONTAINER_NAME..."
    docker run -d --rm -p 3000:3000 --name $CONTAINER_NAME $IMAGE_NAME
    echo "Waiting 10 seconds for container to initialize..."
    sleep 10
fi

echo "Running API tests against Docker container..."
export BASE_URL=http://localhost:3000
npm run test:api

# Optional: Stop container after tests? 
# For now, we leave it running or rely on --rm when stopped manually.
