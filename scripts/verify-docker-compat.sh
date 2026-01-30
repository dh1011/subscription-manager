#!/bin/bash
set -e

# Configuration
RUNTIME="podman"
LOCAL_IMAGE="subscription-manager:local"
REMOTE_IMAGE="dh1011/subscription-manager:3.0.0"
LOCAL_CONTAINER="sub-mgr-local"
REMOTE_CONTAINER="sub-mgr-remote"
LOCAL_PORT=3000
REMOTE_PORT=3001

# Cleanup function
cleanup() {
    echo "Cleaning up containers..."
    $RUNTIME stop $LOCAL_CONTAINER >/dev/null 2>&1 || true
    $RUNTIME stop $REMOTE_CONTAINER >/dev/null 2>&1 || true
    # --rm flag should handle removal, but just in case:
    $RUNTIME rm $LOCAL_CONTAINER >/dev/null 2>&1 || true
    $RUNTIME rm $REMOTE_CONTAINER >/dev/null 2>&1 || true
}

# Trap exit to ensure cleanup
trap cleanup EXIT

echo "=== 1. Building local image with $RUNTIME ==="
$RUNTIME build -t $LOCAL_IMAGE .

echo "=== 2. Starting Local Container ($LOCAL_IMAGE) on port $LOCAL_PORT ==="
$RUNTIME run -d --rm -p $LOCAL_PORT:3000 --name $LOCAL_CONTAINER $LOCAL_IMAGE

echo "=== 3. Starting Remote Container ($REMOTE_IMAGE) on port $REMOTE_PORT ==="
$RUNTIME pull $REMOTE_IMAGE
$RUNTIME run -d --rm -p $REMOTE_PORT:3000 --name $REMOTE_CONTAINER $REMOTE_IMAGE

echo "=== 4. Waiting for containers to initialize (15s) ==="
sleep 15

echo "=== 5. Running API Tests against LOCAL ($LOCAL_PORT) ==="
export BASE_URL="http://localhost:$LOCAL_PORT"
echo "Target: $BASE_URL"
npm run test:api

echo "=== 6. Running API Tests against REMOTE ($REMOTE_PORT) ==="
export BASE_URL="http://localhost:$REMOTE_PORT"
echo "Target: $BASE_URL"
npm run test:api

echo "=== SUCCESS: Both images passed API tests! ==="
