{{- define "bff.fullname" -}}
{{- include "bff.name" . }}
{{- end -}}

{{- define "bff.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bff.labels" -}}
helm.sh/chart: {{ include "bff.name" . }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "bff.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "bff.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bff.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
