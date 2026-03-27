# Emergent-FinanceTracker

## Branches

* **`dockerized`**
  This branch contains the version where the frontend is managed using Yarn.
  However, the Docker Compose build time is relatively slow, typically ranging between **100–300 seconds**.

* **`dockerize_vite`**
  This branch uses Vite for the frontend, resulting in significantly faster build and development times.
  The Docker Compose build time is usually **under 30 seconds**, making it much more efficient for development.

  Due to these performance improvements, this version has been merged into the `main` branch.
