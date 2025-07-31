{{/*
Expand the name of the chart.
*/}}
{{- define "plant-analytics-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "plant-analytics-platform.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "plant-analytics-platform.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "plant-analytics-platform.labels" -}}
helm.sh/chart: {{ include "plant-analytics-platform.chart" . }}
{{ include "plant-analytics-platform.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "plant-analytics-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ include "plant-analytics-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "plant-analytics-platform.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "plant-analytics-platform.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Frontend service name
*/}}
{{- define "plant-analytics-platform.frontend.fullname" -}}
{{- printf "%s-frontend" (include "plant-analytics-platform.fullname" .) }}
{{- end }}

{{/*
API Gateway service name
*/}}
{{- define "plant-analytics-platform.api-gateway.fullname" -}}
{{- printf "%s-api-gateway" (include "plant-analytics-platform.fullname" .) }}
{{- end }}

{{/*
Auth Service name
*/}}
{{- define "plant-analytics-platform.auth-service.fullname" -}}
{{- printf "%s-auth-service" (include "plant-analytics-platform.fullname" .) }}
{{- end }}

{{/*
Backend API service name
*/}}
{{- define "plant-analytics-platform.backend-api.fullname" -}}
{{- printf "%s-backend-api" (include "plant-analytics-platform.fullname" .) }}
{{- end }}

{{/*
Airflow Webserver service name
*/}}
{{- define "plant-analytics-platform.airflow-webserver.fullname" -}}
{{- printf "%s-airflow-webserver" (include "plant-analytics-platform.fullname" .) }}
{{- end }}

{{/*
Airflow Scheduler service name
*/}}
{{- define "plant-analytics-platform.airflow-scheduler.fullname" -}}
{{- printf "%s-airflow-scheduler" (include "plant-analytics-platform.fullname" .) }}
{{- end }}