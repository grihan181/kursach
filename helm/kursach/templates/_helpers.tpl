{{- define "kursach.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "kursach.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "kursach.labels" -}}
helm.sh/chart: {{ include "kursach.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "kursach.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "kursach.selectorLabels" -}}
app.kubernetes.io/name: {{ include "kursach.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "kursach.dbSecretName" -}}
{{- printf "%s-%s-db-credentials" (include "kursach.fullname" .Root) .Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "kursach.redisSecretName" -}}
{{- printf "%s-redis-auth" (include "kursach.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
