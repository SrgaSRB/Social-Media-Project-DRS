FROM python:3.9-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies for PostgreSQL and Python packages
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source code into container
COPY . .

# Expose Flask port
EXPOSE 5000

# Set environment variable so Flask knows where app je
ENV PYTHONPATH=/app
ENV FLASK_APP=app
ENV FLASK_ENV=development

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000", "--reload"]
