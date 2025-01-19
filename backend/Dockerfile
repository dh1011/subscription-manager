# Backend Dockerfile
# Use the official Python image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Ensure the data directory exists
RUN mkdir -p /app/data

# Expose the port
EXPOSE 5000

# Command to run the app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
