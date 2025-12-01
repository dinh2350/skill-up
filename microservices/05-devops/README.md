# Module 05: DevOps & Deployment Strategies

## 🔄 CI/CD Pipeline Design

### Modern CI/CD Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Code     │───►│   Build     │───►│    Test     │───►│   Deploy    │
│   Commit    │    │  & Package  │    │ & Quality   │    │ & Release   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
   ┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Git     │         │Docker   │         │Unit     │         │Blue     │
   │ GitHub  │         │Registry │         │Integration│        │Green    │
   │ GitLab  │         │Artifactory│       │Security │         │Canary   │
   └─────────┘         └─────────┘         └─────────┘         └─────────┘
```

### GitHub Actions Pipeline

```yaml
# .github/workflows/microservice-ci-cd.yml
name: Microservice CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/order-service/**'
  pull_request:
    branches: [main]
    paths:
      - 'services/order-service/**'

env:
  SERVICE_NAME: order-service
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/order-service

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: orders_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'services/order-service/package-lock.json'

    - name: Install dependencies
      working-directory: services/order-service
      run: npm ci

    - name: Run linting
      working-directory: services/order-service
      run: npm run lint

    - name: Run unit tests
      working-directory: services/order-service
      run: npm run test:unit
      env:
        NODE_ENV: test

    - name: Run integration tests
      working-directory: services/order-service
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:test@localhost:5432/orders_test
        REDIS_URL: redis://localhost:6379

    - name: Generate test coverage
      working-directory: services/order-service
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: services/order-service/coverage/lcov.info
        flags: order-service

  security:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: 'services/order-service'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

    - name: Audit npm dependencies
      working-directory: services/order-service
      run: npm audit --audit-level high

  build:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.event_name == 'push'

    outputs:
      image: ${{ steps.image.outputs.image }}
      digest: ${{ steps.build.outputs.digest }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v5
      with:
        context: services/order-service
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Output image
      id: image
      run: echo "image=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}" >> $GITHUB_OUTPUT

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG }}

    - name: Deploy to staging
      run: |
        envsubst < k8s/staging/deployment.yaml | kubectl apply -f -
        kubectl rollout status deployment/${{ env.SERVICE_NAME }} -n staging
      env:
        IMAGE: ${{ needs.build.outputs.image }}

    - name: Run smoke tests
      run: |
        kubectl wait --for=condition=ready pod -l app=${{ env.SERVICE_NAME }} -n staging --timeout=300s
        npm run test:smoke
      env:
        API_URL: https://api-staging.company.com

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build, deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG_PROD }}

    - name: Deploy with blue-green strategy
      run: |
        # Deploy to blue environment
        envsubst < k8s/production/deployment-blue.yaml | kubectl apply -f -
        kubectl rollout status deployment/${{ env.SERVICE_NAME }}-blue -n production
        
        # Health check
        kubectl wait --for=condition=ready pod -l app=${{ env.SERVICE_NAME }},version=blue -n production --timeout=300s
        
        # Switch traffic
        kubectl patch service ${{ env.SERVICE_NAME }} -n production -p '{"spec":{"selector":{"version":"blue"}}}'
        
        # Clean up green deployment after successful switch
        kubectl delete deployment ${{ env.SERVICE_NAME }}-green -n production --ignore-not-found
      env:
        IMAGE: ${{ needs.build.outputs.image }}

    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: "🚀 ${{ env.SERVICE_NAME }} deployed to production"
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - test
  - security
  - build
  - deploy

variables:
  DOCKER_HOST: tcp://docker:2376
  DOCKER_TLS_CERTDIR: "/certs"
  SERVICE_NAME: order-service
  REGISTRY: $CI_REGISTRY_IMAGE

.microservice-changes:
  rules:
    - changes:
        - services/order-service/**/*
      when: on_success

test:unit:
  extends: .microservice-changes
  stage: test
  image: node:18-alpine
  services:
    - name: postgres:14
      alias: postgres
      variables:
        POSTGRES_PASSWORD: test
        POSTGRES_DB: orders_test
  variables:
    DATABASE_URL: "postgresql://postgres:test@postgres:5432/orders_test"
  script:
    - cd services/order-service
    - npm ci
    - npm run lint
    - npm run test:unit
    - npm run test:integration
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: services/order-service/coverage/cobertura-coverage.xml
    paths:
      - services/order-service/coverage/
    expire_in: 1 week
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'

security:scan:
  extends: .microservice-changes
  stage: security
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker run --rm -v "$PWD:/workspace" aquasec/trivy fs --format json --output trivy-report.json /workspace/services/order-service
  artifacts:
    reports:
      container_scanning: trivy-report.json

build:image:
  extends: .microservice-changes
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
  script:
    - cd services/order-service
    - docker build --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') --build-arg VCS_REF=$CI_COMMIT_SHA -t $REGISTRY/$SERVICE_NAME:$CI_COMMIT_SHA .
    - docker tag $REGISTRY/$SERVICE_NAME:$CI_COMMIT_SHA $REGISTRY/$SERVICE_NAME:latest
    - docker push $REGISTRY/$SERVICE_NAME:$CI_COMMIT_SHA
    - docker push $REGISTRY/$SERVICE_NAME:latest

deploy:staging:
  extends: .microservice-changes
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://api-staging.company.com
  script:
    - envsubst < k8s/staging/deployment.yaml | kubectl apply -f -
    - kubectl rollout status deployment/$SERVICE_NAME -n staging
  only:
    - develop

deploy:production:
  extends: .microservice-changes
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://api.company.com
  script:
    - envsubst < k8s/production/deployment.yaml | kubectl apply -f -
    - kubectl rollout status deployment/$SERVICE_NAME -n production
  when: manual
  only:
    - main
```

## 🏗️ Infrastructure as Code (IaC)

### Terraform for AWS Infrastructure

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "company-terraform-state"
    key    = "microservices/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "${var.environment}-microservices-vpc"
  cidr = var.vpc_cidr
  
  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true
  
  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "${var.environment}-microservices"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true
  
  node_groups = {
    main = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 3
      
      instance_types = ["t3.medium"]
      
      labels = {
        Environment = var.environment
        Application = "microservices"
      }
      
      taints = []
    }
  }
  
  tags = local.common_tags
}

# RDS for shared databases
resource "aws_db_instance" "shared_postgres" {
  identifier = "${var.environment}-microservices-db"
  
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = "microservices"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.environment == "production" ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  deletion_protection = var.environment == "production"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-microservices-db"
  })
}

# ElastiCache for Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-microservices-cache"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.environment}-microservices-redis"
  description                = "Redis cluster for microservices"
  
  engine               = "redis"
  node_type            = var.redis_node_type
  port                 = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_clusters = var.environment == "production" ? 3 : 1
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = var.redis_auth_token
  
  tags = local.common_tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-microservices-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  
  enable_deletion_protection = var.environment == "production"
  
  tags = local.common_tags
}

# Local variables
locals {
  common_tags = {
    Environment = var.environment
    Project     = "microservices"
    ManagedBy   = "terraform"
  }
}
```

### Kubernetes Resources with Helm

```yaml
# helm/order-service/values.yaml
replicaCount: 3

image:
  repository: myregistry/order-service
  pullPolicy: IfNotPresent
  tag: ""

nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/path: "/metrics"
  prometheus.io/port: "8080"

podSecurityContext:
  fsGroup: 2000
  runAsNonRoot: true
  runAsUser: 1000

securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: "nginx"
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: api.company.com
      paths:
        - path: /orders
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts:
        - api.company.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app.kubernetes.io/name
            operator: In
            values:
            - order-service
        topologyKey: kubernetes.io/hostname

# Application-specific configuration
config:
  database:
    host: postgres-service
    port: 5432
    name: orders
  redis:
    host: redis-service
    port: 6379
  kafka:
    brokers: kafka-service:9092
    topics:
      orderEvents: order-events

secrets:
  database:
    username: orders_user
    password: ""
  redis:
    password: ""
  jwt:
    secret: ""

# Monitoring
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    interval: 30s
    path: /metrics

# Health checks
healthCheck:
  enabled: true
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
  readinessProbe:
    path: /health
    port: 8080
  livenessProbe:
    path: /health
    port: 8080
```

### Helm Chart Templates

```yaml
# helm/order-service/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "order-service.fullname" . }}
  labels:
    {{- include "order-service.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "order-service.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "order-service.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "order-service.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.targetPort }}
              protocol: TCP
          {{- if .Values.healthCheck.enabled }}
          livenessProbe:
            httpGet:
              path: {{ .Values.healthCheck.livenessProbe.path }}
              port: {{ .Values.healthCheck.livenessProbe.port }}
            initialDelaySeconds: {{ .Values.healthCheck.initialDelaySeconds }}
            periodSeconds: {{ .Values.healthCheck.periodSeconds }}
            timeoutSeconds: {{ .Values.healthCheck.timeoutSeconds }}
            failureThreshold: {{ .Values.healthCheck.failureThreshold }}
          readinessProbe:
            httpGet:
              path: {{ .Values.healthCheck.readinessProbe.path }}
              port: {{ .Values.healthCheck.readinessProbe.port }}
            initialDelaySeconds: {{ .Values.healthCheck.initialDelaySeconds }}
            periodSeconds: {{ .Values.healthCheck.periodSeconds }}
            timeoutSeconds: {{ .Values.healthCheck.timeoutSeconds }}
            failureThreshold: {{ .Values.healthCheck.failureThreshold }}
          {{- end }}
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "{{ .Values.service.targetPort }}"
            - name: DB_HOST
              value: "{{ .Values.config.database.host }}"
            - name: DB_PORT
              value: "{{ .Values.config.database.port }}"
            - name: DB_NAME
              value: "{{ .Values.config.database.name }}"
            - name: DB_USERNAME
              valueFrom:
                secretKeyRef:
                  name: {{ include "order-service.fullname" . }}-secret
                  key: database-username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "order-service.fullname" . }}-secret
                  key: database-password
          volumeMounts:
            - name: config-volume
              mountPath: /app/config
              readOnly: true
            - name: tmp
              mountPath: /tmp
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      volumes:
        - name: config-volume
          configMap:
            name: {{ include "order-service.fullname" . }}-config
        - name: tmp
          emptyDir: {}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

## 🔵🟢 Deployment Patterns

### Blue-Green Deployment

```yaml
# Blue-Green Deployment Script
apiVersion: v1
kind: Script
metadata:
  name: blue-green-deploy
data:
  deploy.sh: |
    #!/bin/bash
    set -euo pipefail
    
    SERVICE_NAME=${1:-order-service}
    NEW_VERSION=${2:-latest}
    NAMESPACE=${3:-production}
    
    # Determine current color
    CURRENT_COLOR=$(kubectl get service $SERVICE_NAME -n $NAMESPACE -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "none")
    
    if [[ "$CURRENT_COLOR" == "blue" ]]; then
        NEW_COLOR="green"
        OLD_COLOR="blue"
    else
        NEW_COLOR="blue"
        OLD_COLOR="green"
    fi
    
    echo "Deploying $SERVICE_NAME:$NEW_VERSION as $NEW_COLOR environment..."
    
    # Deploy new version
    cat <<EOF | kubectl apply -f -
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: $SERVICE_NAME-$NEW_COLOR
      namespace: $NAMESPACE
    spec:
      replicas: 3
      selector:
        matchLabels:
          app: $SERVICE_NAME
          version: $NEW_COLOR
      template:
        metadata:
          labels:
            app: $SERVICE_NAME
            version: $NEW_COLOR
        spec:
          containers:
          - name: $SERVICE_NAME
            image: myregistry/$SERVICE_NAME:$NEW_VERSION
            ports:
            - containerPort: 8080
            readinessProbe:
              httpGet:
                path: /health
                port: 8080
              initialDelaySeconds: 10
              periodSeconds: 5
            livenessProbe:
              httpGet:
                path: /health
                port: 8080
              initialDelaySeconds: 30
              periodSeconds: 10
    EOF
    
    # Wait for deployment to be ready
    echo "Waiting for $NEW_COLOR deployment to be ready..."
    kubectl rollout status deployment/$SERVICE_NAME-$NEW_COLOR -n $NAMESPACE --timeout=300s
    
    # Health check
    echo "Performing health check..."
    kubectl wait --for=condition=ready pod -l app=$SERVICE_NAME,version=$NEW_COLOR -n $NAMESPACE --timeout=120s
    
    # Run smoke tests
    echo "Running smoke tests..."
    POD_NAME=$(kubectl get pods -l app=$SERVICE_NAME,version=$NEW_COLOR -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}')
    kubectl exec $POD_NAME -n $NAMESPACE -- curl -f http://localhost:8080/health
    
    # Switch traffic
    echo "Switching traffic to $NEW_COLOR..."
    kubectl patch service $SERVICE_NAME -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_COLOR\"}}}"
    
    # Wait a bit for traffic to settle
    sleep 30
    
    # Final health check
    echo "Final health check after traffic switch..."
    kubectl exec $POD_NAME -n $NAMESPACE -- curl -f http://localhost:8080/health
    
    # Clean up old deployment
    if [[ "$OLD_COLOR" != "none" ]]; then
        echo "Cleaning up $OLD_COLOR deployment..."
        kubectl delete deployment $SERVICE_NAME-$OLD_COLOR -n $NAMESPACE --ignore-not-found=true
    fi
    
    echo "Blue-Green deployment completed successfully!"
```

### Canary Deployment with Istio

```yaml
# Canary Deployment with Istio
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service-canary
  namespace: production
spec:
  hosts:
  - order-service
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: order-service
        subset: v2
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 90
    - destination:
        host: order-service
        subset: v2
      weight: 10

---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
  namespace: production
spec:
  host: order-service
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

### Progressive Canary with Flagger

```yaml
# Flagger Canary Configuration
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: order-service
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  progressDeadlineSeconds: 60
  service:
    port: 80
    targetPort: 8080
    gateways:
    - public-gateway
    hosts:
    - api.company.com
  analysis:
    interval: 30s
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 30s
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 30s
    webhooks:
    - name: load-test
      url: http://loadtest-runner.test/
      timeout: 5s
      metadata:
        cmd: "hey -z 10m -q 10 -c 2 http://api.company.com/orders/health"
```

## 🔧 Configuration Management

### External Configuration with ConfigMaps

```yaml
# Application ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-service-config
  namespace: production
data:
  application.yaml: |
    server:
      port: 8080
    
    spring:
      application:
        name: order-service
      profiles:
        active: production
      
    database:
      connection-pool:
        min-size: 10
        max-size: 50
        connection-timeout: 30000
    
    kafka:
      bootstrap-servers: kafka-cluster:9092
      topics:
        order-events: order.events
        payment-events: payment.events
      consumer:
        group-id: order-service-consumer
        auto-offset-reset: earliest
    
    resilience:
      circuit-breaker:
        payment-service:
          failure-rate-threshold: 50
          wait-duration-in-open-state: 30s
          sliding-window-size: 10
      retry:
        payment-service:
          max-attempts: 3
          wait-duration: 1s
    
    monitoring:
      metrics:
        export:
          prometheus:
            enabled: true
      tracing:
        jaeger:
          endpoint: http://jaeger-collector:14268/api/traces

---
# Feature Flags ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: feature-flags
  namespace: production
data:
  flags.json: |
    {
      "features": {
        "payment-v2": {
          "enabled": true,
          "rollout": 25
        },
        "inventory-validation": {
          "enabled": true,
          "rollout": 100
        },
        "order-notifications": {
          "enabled": false,
          "rollout": 0
        }
      }
    }
```

### Secrets Management

```yaml
# Sealed Secrets (GitOps-friendly)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: order-service-secrets
  namespace: production
spec:
  encryptedData:
    database-username: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAM...
    database-password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAM...
    jwt-secret: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAM...
    kafka-sasl-password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAM...
  template:
    metadata:
      name: order-service-secrets
      namespace: production
    type: Opaque

---
# External Secrets Operator (AWS Secrets Manager)
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-west-2
      auth:
        serviceAccount:
          name: external-secrets-sa

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: order-service-db-secret
  namespace: production
spec:
  refreshInterval: 15s
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: order-service-db-secret
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: microservices/order-service/database
      property: username
  - secretKey: password
    remoteRef:
      key: microservices/order-service/database
      property: password
```

## 🧪 Knowledge Check Quiz

### Question 1
What is the main advantage of blue-green deployment over rolling updates?
a) Faster deployment
b) Zero-downtime rollback
c) Lower resource usage
d) Automatic testing

<details>
<summary>Answer</summary>
b) Zero-downtime rollback - Blue-green allows instant rollback by switching traffic back to the previous environment
</details>

### Question 2
Which tool is best for progressive canary deployments in Kubernetes?
a) Helm
b) ArgoCD
c) Flagger
d) Kustomize

<details>
<summary>Answer</summary>
c) Flagger - Flagger specializes in automated canary deployments with progressive traffic shifting based on metrics
</details>

### Question 3
What is the recommended approach for managing secrets in GitOps workflows?
a) Store them in Git
b) Use Sealed Secrets or External Secrets Operator
c) Environment variables only
d) ConfigMaps

<details>
<summary>Answer</summary>
b) Use Sealed Secrets or External Secrets Operator - These tools allow encrypted secrets in Git while maintaining security
</details>

## 🎯 Hands-on Assignment

**Task:** Build a complete CI/CD pipeline for a microservice

**Requirements:**
1. **Source Control**: Git workflow with feature branches
2. **CI Pipeline**: Automated testing, security scanning, and builds
3. **Container Registry**: Secure image storage with vulnerability scanning
4. **Infrastructure**: Terraform modules for AWS/GCP/Azure
5. **Deployment**: Blue-green or canary deployment strategy
6. **Monitoring**: Pipeline metrics and deployment tracking
7. **Security**: Secret management and RBAC
8. **GitOps**: Declarative configuration management

**Deliverables:**
- [ ] GitHub Actions or GitLab CI pipeline
- [ ] Terraform infrastructure code
- [ ] Kubernetes manifests or Helm charts
- [ ] Deployment automation scripts
- [ ] Secret management setup
- [ ] Monitoring and alerting configuration
- [ ] Documentation for the entire pipeline

**Next Module:** [Security Implementation](../06-security/) - Learn about authentication, authorization, and securing microservices communication.