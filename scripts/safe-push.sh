#!/bin/bash
# Safe Push Script
# Runs tests first, then commits and pushes only if tests pass.

set -e # Exit immediately if any command exits with a non-zero status

# 1. Run Tests
echo "🧪 Running API Tests (Docker implementation)..."

# Force a clean container environment
echo "🔄 Cleaning up any existing test containers..."
docker stop subscription-manager-final >/dev/null 2>&1 || true
docker rm subscription-manager-final >/dev/null 2>&1 || true

./scripts/test-docker.sh

echo "✅ Tests Passed!"

# 2. Prepare Commit
echo ""
echo "📝 Preparing to commit..."

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then 
  echo "⚠️  No changes to commit."
  exit 0
fi

# Get commit message
if [ -z "$1" ]; then
    read -p "Enter commit message: " COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

if [ -z "$COMMIT_MSG" ]; then
    echo "❌ Commit message cannot be empty. Aborting."
    exit 1
fi

# 3. Commit and Push
echo "🚀 Committing and Pushing..."
git add .
git commit -m "$COMMIT_MSG"
git push origin main

echo "🎉 Success! Code pushed to main."
