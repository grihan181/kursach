{{- define "umbrella.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "umbrella.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "umbrella.kafkaConfigName" -}}
{{- if .Values.config.name -}}
{{ .Values.config.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
{{ printf "%s-kafka-config" (include "umbrella.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end -}}
{{- end -}}

{{- define "umbrella.kafkaSecretName" -}}
{{- if .Values.secret.name -}}
{{ .Values.secret.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
{{ printf "%s-kafka-credentials" (include "umbrella.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end -}}
{{- end -}}

{{- define "umbrella.kafka.bootstrapServers" -}}
{{- if .Values.global.kafka.external.enabled -}}
{{- required "global.kafka.external.bootstrapServers is required when external Kafka is enabled" .Values.global.kafka.external.bootstrapServers -}}
{{- else if .Values.global.kafka.bootstrapServers -}}
{{ .Values.global.kafka.bootstrapServers }}
{{- else -}}
{{ printf "%s-kafka:9092" (include "umbrella.fullname" .) }}
{{- end -}}
{{- end -}}

{{- define "umbrella.kafka.authEnabled" -}}
{{- if .Values.global.kafka.auth.enabled }}true{{ else }}false{{ end }}
{{- end -}}
