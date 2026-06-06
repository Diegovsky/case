FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen

# Copy the rest of the application
COPY . .

# Ensure the media directory exists
RUN mkdir -p /app/media

# Expose the Django port
EXPOSE 8000

# Run the development server
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]
