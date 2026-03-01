.PHONY: up down build logs migrate ingest test test-backend test-web clean \
       k8s-up k8s-down k8s-logs k8s-ingest k8s-status k8s-forward

# ── Docker Compose ───────────────────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

migrate:
	docker compose exec backend alembic upgrade head

ingest:
	docker compose exec backend python scripts/ingest_cases.py data/sample_cases.json

test: test-backend test-web

test-backend:
	cd backend && python3 -m pytest tests/ -v

test-web:
	cd web && npx jest --verbose

clean:
	docker compose down -v

# ── Kubernetes / Minikube ────────────────────────────────────────────

K8S_NS = supreme-court

k8s-up:
	bash k8s/deploy.sh

k8s-down:
	helm uninstall supreme-court -n $(K8S_NS) 2>/dev/null || true
	minikube stop

k8s-status:
	kubectl get pods,svc,ingress -n $(K8S_NS)

k8s-logs:
	kubectl logs -f -l app.kubernetes.io/part-of=supreme-court-explorer -n $(K8S_NS) --all-containers --max-log-requests=10

k8s-ingest:
	kubectl delete job supreme-court-ingest -n $(K8S_NS) 2>/dev/null || true
	kubectl apply -f k8s/supreme-court-explorer/templates/jobs/ingest-job.yaml -n $(K8S_NS) 2>/dev/null || \
		helm template supreme-court k8s/supreme-court-explorer -s templates/jobs/ingest-job.yaml | kubectl apply -n $(K8S_NS) -f -

k8s-forward:
	@echo "Forwarding web → localhost:3000, backend → localhost:8000"
	@kubectl port-forward -n $(K8S_NS) svc/backend 8000:8000 &
	@kubectl port-forward -n $(K8S_NS) svc/web 3000:3000

