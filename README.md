# kursach

This repository contains an umbrella Helm chart that provisions Kafka or connects
to an external broker and shares connection settings with dependent services.

## Features
- Bitnami Kafka dependency that can be enabled or disabled via `kafka.enabled`.
- ConfigMap exposing Kafka bootstrap servers for workloads.
- Optional Secret for SASL credentials.
- Post-install/upgrade job that creates required topics: `order.events`,
  `chat.notifications`, and `notifications.outbound`.

## Usage
1. Pull the Kafka dependency:
   ```bash
   helm dependency update charts/umbrella
   ```
2. Install with an internal broker:
   ```bash
   helm install my-release charts/umbrella
   ```
3. Install using an external broker:
   ```bash
   helm install my-release charts/umbrella \
     --set global.kafka.external.enabled=true \
     --set global.kafka.external.bootstrapServers=my-kafka:9092 \
     --set global.kafka.auth.enabled=true \
     --set global.kafka.auth.username=user \
     --set global.kafka.auth.password=pass
   ```
