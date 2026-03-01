{{/*
Common labels applied to all resources.
*/}}
{{- define "sc.labels" -}}
app.kubernetes.io/part-of: supreme-court-explorer
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{/*
Selector labels for a given component.
Usage: {{ include "sc.selectorLabels" (dict "component" "backend" "root" .) }}
*/}}
{{- define "sc.selectorLabels" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/part-of: supreme-court-explorer
{{- end -}}
