#!/bin/bash
# Run API tests against local dev server

echo "Running API tests against local dev server..."
export BASE_URL=http://localhost:3000
npm run test:api
