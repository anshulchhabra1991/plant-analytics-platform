# ---------- Build Commands ----------
.PHONY: build build-backend build-gateway build-libs

build:
	npm run build --workspaces

build-backend:
	npm run build --workspace=apps/backend-api

build-gateway:
	npm run build --workspace=apps/api-gateway

build-libs:
	npm run build --workspaces --workspace=libs/*

# ---------- Start Commands ----------
.PHONY: start start-dev start-backend start-gateway

start:
	docker-compose -f docker/docker-compose.yml up

start-dev:
	docker-compose -f docker/docker-compose.yml up --watch

start-backend:
	npm run start:dev --workspace=apps/backend-api

start-gateway:
	npm run dev --workspace=apps/api-gateway

# ---------- Stop Commands ----------
.PHONY: stop stop-volumes

stop:
	docker-compose -f docker/docker-compose.yml down

stop-volumes:
	docker-compose -f docker/docker-compose.yml down -v

# ---------- Test Commands ----------
.PHONY: test test-watch test-e2e

test:
	npm run test --workspaces

test-watch:
	npm run test:watch --workspaces

test-e2e:
	npm run test:e2e --workspaces

# ---------- Lint & Format ----------
.PHONY: lint lint-check format format-check

lint:
	eslint "**/*.{js,jsx,ts,tsx}" --fix

lint-check:
	eslint "**/*.{js,jsx,ts,tsx}"

format:
	prettier --write "**/*.{js,jsx,ts,tsx,json,md,yml,yaml}"

format-check:
	prettier --check "**/*.{js,jsx,ts,tsx,json,md,yml,yaml}"

# ---------- Maintenance ----------
.PHONY: clean reset

clean:
	npm run clean --workspaces && rm -rf node_modules

reset:
	npm run clean && npm install

# ---------- Docker ----------
.PHONY: docker-build docker-rebuild

docker-build:
	docker-compose build

docker-rebuild:
	docker-compose build --no-cache

# ---------- Logs ----------
.PHONY: logs logs-backend logs-gateway

logs:
	docker-compose -f docker/docker-compose.yml logs -f

logs-backend:
	docker-compose -f docker/docker-compose.yml logs -f backend-api

logs-gateway:
	docker-compose -f docker/docker-compose.yml logs -f api-gateway

run-k8s:
	./scripts/deploy-k8s.sh

# ---------- Misc ----------
.PHONY: health setup run-project clean-setup

health:
	curl http://localhost:8080/health

clean-setup:
	./scripts/clean-setup.sh

run-project:
	./scripts/run-system.sh

