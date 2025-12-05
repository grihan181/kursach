# kursach Helm assets

Umbrella Helm chart that provisions dedicated PostgreSQL instances for the **Auth**, **Orders**, and **Chat** services, along with an optional Redis cache/session store and migration jobs triggered as Helm hooks.

## Contents
- `helm/kursach/Chart.yaml` — defines dependencies on Bitnami PostgreSQL (three aliases) and optional Redis.
- `helm/kursach/values.yaml` — default credentials, persistence sizing, StorageClass choices, and migration job definitions.
- `helm/kursach/templates/` — renders Secrets for credentials and hook-based migration Jobs with pod-level overrides.

## Usage
1. Add the Bitnami repository (only needed at install time):
   ```bash
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm dependency update helm/kursach
   ```
2. Override any secrets, storage classes, or image references in a custom values file to avoid committing real credentials.
   You can also toggle migrations via `migrations.enabled`, adjust their backoff/TTL, and supply service account, node
   scheduling, or extra environment variables for each job.
3. Install or upgrade:
   ```bash
   helm upgrade --install platform helm/kursach -f my-values.yaml
   ```

The chart creates three separate PostgreSQL releases (one per service), an optional Redis release for sessions/cache, stores credentials in Kubernetes Secrets, and runs post-install/upgrade Jobs for database migrations.
