FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for PostgreSQL and Python
RUN apt-get update && apt-get install -y \
    libpq-dev gcc --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose Flask port
EXPOSE 5000

# Set entrypoint and default command
ENTRYPOINT ["python"]
CMD ["run.py"]
