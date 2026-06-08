FROM alpine/curl:latest
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen
COPY . .

RUN mkdir -p /app/database

RUN sh -c \
  'source .env && \
  uv run python manage.py migrate'

RUN sh -c \
  'source .env && \
  uv run python manage.py seed'

EXPOSE 8000

# Run the development server
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]
