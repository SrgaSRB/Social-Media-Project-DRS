# Stage 1: Frontend (React App)
FROM node:16-alpine AS frontend

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY ./Frontend/package.json ./Frontend/package-lock.json ./

# Install dependencies
RUN npm install

# Copy all frontend files (excluding those in .dockerignore)
COPY ./Frontend ./

# Build the React app
RUN npm run build

# Stage 2: Backend (Flask App)
FROM python:3.9-slim AS backend

# Set working directory
WORKDIR /app

# Install system dependencies for PostgreSQL and Python
RUN apt-get update && apt-get install -y \
    libpq-dev gcc --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY ./Backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./Backend ./

# Expose Flask port
EXPOSE 5000

# Copy the built frontend files into the backend folder
COPY --from=frontend /app/build /app/frontend

# Set entrypoint and default command for Flask app
ENTRYPOINT ["python"]
CMD ["run.py"]
