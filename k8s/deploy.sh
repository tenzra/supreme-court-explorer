#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHART_DIR="$SCRIPT_DIR/supreme-court-explorer"
RELEASE_NAME="supreme-court"
NAMESPACE="supreme-court"

info()  { echo -e "\n\033[1;34m=> $*\033[0m"; }
ok()    { echo -e "\033[1;32m   $*\033[0m"; }
warn()  { echo -e "\033[1;33m   $*\033[0m"; }

# ── 1. Install prerequisites ────────────────────────────────────────

install_minikube() {
  if command -v minikube &>/dev/null; then ok "minikube already installed"; return; fi
  info "Installing minikube..."
  curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
  sudo install minikube-linux-amd64 /usr/local/bin/minikube
  rm -f minikube-linux-amd64
  ok "minikube installed"
}

install_kubectl() {
  if command -v kubectl &>/dev/null; then ok "kubectl already installed"; return; fi
  info "Installing kubectl..."
  curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  sudo install kubectl /usr/local/bin/kubectl
  rm -f kubectl
  ok "kubectl installed"
}

install_helm() {
  if command -v helm &>/dev/null; then ok "helm already installed"; return; fi
  info "Installing helm..."
  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
  ok "helm installed"
}

info "Checking prerequisites"
install_minikube
install_kubectl
install_helm

# ── 2. Start Minikube ────────────────────────────────────────────────

info "Starting Minikube cluster"
if minikube status --format='{{.Host}}' 2>/dev/null | grep -q Running; then
  ok "Minikube already running"
else
  minikube start --memory=6g --cpus=4 --driver=docker --gpus=all
  ok "Minikube started"
fi

info "Enabling ingress addon"
minikube addons enable ingress

# ── 3. Build images inside Minikube's Docker ─────────────────────────

info "Pointing Docker to Minikube daemon"
eval $(minikube docker-env)

if docker image inspect supreme-court-backend:latest &>/dev/null; then
  ok "Backend image already built"
else
  info "Building backend image"
  docker build -t supreme-court-backend:latest -f "$PROJECT_ROOT/backend/Dockerfile" "$PROJECT_ROOT/backend"
fi

if docker image inspect supreme-court-web:latest &>/dev/null; then
  ok "Web image already built"
else
  info "Building web image"
  docker build -t supreme-court-web:latest -f "$PROJECT_ROOT/web/Dockerfile" "$PROJECT_ROOT"
fi

# ── 4. Deploy with Helm ──────────────────────────────────────────────

info "Deploying with Helm"
if helm status "$RELEASE_NAME" -n "$NAMESPACE" &>/dev/null; then
  helm upgrade "$RELEASE_NAME" "$CHART_DIR" -n "$NAMESPACE"
  ok "Helm release upgraded"
else
  helm install "$RELEASE_NAME" "$CHART_DIR" -n "$NAMESPACE" --create-namespace
  ok "Helm release installed"
fi

# ── 5. Wait for pods ─────────────────────────────────────────────────

info "Waiting for pods to be ready (this may take a few minutes for Ollama model downloads)..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=supreme-court-explorer \
  -n "$NAMESPACE" --timeout=600s 2>/dev/null || warn "Some pods may still be starting"

# ── 6. Print access info ─────────────────────────────────────────────

info "Deployment complete!"
echo ""
MINIKUBE_IP=$(minikube ip)
echo "  Ingress URL:  http://$MINIKUBE_IP"
echo ""
echo "  Or use port-forwarding:"
echo "    kubectl port-forward -n $NAMESPACE svc/web 3000:3000 &"
echo "    kubectl port-forward -n $NAMESPACE svc/backend 8000:8000 &"
echo ""
echo "  Then open http://localhost:3000"
echo ""
echo "  To ingest sample cases:"
echo "    make k8s-ingest"
echo ""
echo "  To view logs:"
echo "    make k8s-logs"
