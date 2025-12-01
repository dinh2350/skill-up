# Module 06: Security Implementation

## 🔐 Security Fundamentals in Microservices

### Security Challenges in Distributed Systems

1. **Distributed Attack Surface**: More endpoints to secure
2. **Service-to-Service Communication**: Internal network security
3. **Identity Propagation**: User context across services
4. **Secret Management**: Distributed credential storage
5. **Data Protection**: Encryption in transit and at rest
6. **Compliance**: GDPR, HIPAA, SOX across services

### Zero Trust Security Model

```
Traditional Perimeter Security:
┌─────────────────────────────────┐
│        Trusted Zone             │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │Svc A│ │Svc B│ │Svc C│       │
│  └─────┘ └─────┘ └─────┘       │
└─────────────────────────────────┘
         Firewall

Zero Trust Model:
🔒 Service A ──(mTLS)──► 🔒 Service B
      │                      │
   (Auth)                 (Auth)
      │                      │
      ▼                      ▼
🔒 Identity Provider  🔒 Service C
```

## 🎫 Authentication & Authorization

### JWT (JSON Web Tokens) Implementation

#### JWT Structure
```
Header.Payload.Signature

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

#### JWT Service Implementation (Node.js)

```typescript
// auth.service.ts
import jwt from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string[];
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtIssuer: string;
  private readonly jwtAudience: string[];

  constructor(private configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.jwtIssuer = this.configService.get<string>('JWT_ISSUER');
    this.jwtAudience = this.configService.get<string>('JWT_AUDIENCE').split(',');
  }

  generateToken(user: User): string {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.getPermissions(),
      iss: this.jwtIssuer,
      aud: this.jwtAudience
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '1h',
      algorithm: 'RS256' // Use RSA for production
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
        algorithms: ['RS256']
      }) as JWTPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  refreshToken(refreshToken: string): string {
    try {
      const payload = jwt.verify(refreshToken, this.jwtSecret) as any;
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user and generate new access token
      const user = await this.userService.findById(payload.sub);
      return this.generateToken(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

// JWT Guard
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = this.authService.verifyToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// Role-based Access Control
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Permission-based Access Control
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredPermissions.every((permission) => 
      user.permissions?.includes(permission)
    );
  }
}
```

#### Controller with Authentication

```typescript
// order.controller.ts
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @Roles('user', 'admin')
  @Permissions('order:create')
  @ApiOperation({ summary: 'Create a new order' })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @User() user: JWTPayload
  ): Promise<OrderResponseDto> {
    return await this.orderService.createOrder(createOrderDto, user.sub);
  }

  @Get(':id')
  @Permissions('order:read')
  async getOrder(
    @Param('id') id: string,
    @User() user: JWTPayload
  ): Promise<OrderResponseDto> {
    const order = await this.orderService.getOrder(id);
    
    // Check if user can access this order
    if (order.customerId !== user.sub && !user.roles.includes('admin')) {
      throw new ForbiddenException('Cannot access this order');
    }
    
    return order;
  }

  @Get()
  @Roles('admin')
  @Permissions('order:list')
  async getOrders(
    @Query() query: GetOrdersQueryDto
  ): Promise<OrderResponseDto[]> {
    return await this.orderService.getOrders(query);
  }
}

// Custom decorators
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

## 🔐 OAuth2 & OpenID Connect

### OAuth2 Flow Implementation

```typescript
// oauth2.service.ts
@Injectable()
export class OAuth2Service {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authorizationEndpoint: string;
  private readonly tokenEndpoint: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('OAUTH2_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('OAUTH2_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('OAUTH2_REDIRECT_URI');
    this.authorizationEndpoint = this.configService.get<string>('OAUTH2_AUTH_ENDPOINT');
    this.tokenEndpoint = this.configService.get<string>('OAUTH2_TOKEN_ENDPOINT');
  }

  // Authorization Code Flow
  getAuthorizationUrl(state: string, scopes: string[] = ['openid', 'profile', 'email']): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state: state,
      code_challenge: this.generateCodeChallenge(),
      code_challenge_method: 'S256'
    });

    return `${this.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenResponse> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to exchange code for tokens');
    }

    return await response.json();
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to refresh token');
    }

    return await response.json();
  }

  // Client Credentials Flow (Service-to-Service)
  async getClientCredentialsToken(scopes: string[] = []): Promise<TokenResponse> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scopes.join(' ')
      })
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to get client credentials token');
    }

    return await response.json();
  }

  private generateCodeChallenge(): string {
    const codeVerifier = this.generateCodeVerifier();
    // Store codeVerifier in session or cache for later use
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  id_token?: string; // OpenID Connect
}
```

### OpenID Connect Integration

```typescript
// oidc.service.ts
import { Injectable } from '@nestjs/common';
import { JwksClient } from 'jwks-rsa';
import jwt from 'jsonwebtoken';

@Injectable()
export class OIDCService {
  private jwksClient: JwksClient;

  constructor(private configService: ConfigService) {
    this.jwksClient = new JwksClient({
      jwksUri: this.configService.get<string>('OIDC_JWKS_URI'),
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000 // 10 minutes
    });
  }

  async validateIdToken(idToken: string): Promise<any> {
    try {
      // Decode token header to get key ID
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || !decoded.header.kid) {
        throw new Error('Invalid token structure');
      }

      // Get signing key
      const key = await this.jwksClient.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      // Verify token
      const payload = jwt.verify(idToken, signingKey, {
        issuer: this.configService.get<string>('OIDC_ISSUER'),
        audience: this.configService.get<string>('OAUTH2_CLIENT_ID'),
        algorithms: ['RS256']
      });

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid ID token');
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(
      this.configService.get<string>('OIDC_USERINFO_ENDPOINT'),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new UnauthorizedException('Failed to get user info');
    }

    return await response.json();
  }
}
```

## 🔐 Service-to-Service Authentication

### Mutual TLS (mTLS) Implementation

```yaml
# mTLS Certificate Configuration
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: order-service-cert
  namespace: production
spec:
  secretName: order-service-tls
  issuerRef:
    name: internal-ca-issuer
    kind: ClusterIssuer
  commonName: order-service.production.svc.cluster.local
  dnsNames:
  - order-service.production.svc.cluster.local
  - order-service
  usages:
  - digital signature
  - key encipherment
  - server auth
  - client auth

---
# Istio PeerAuthentication for mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT

---
# Istio AuthorizationPolicy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: order-service-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: order-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/payment-service"]
  - to:
    - operation:
        methods: ["POST"]
        paths: ["/api/orders/*/confirm-payment"]
```

### Service Account Token Authentication

```typescript
// service-auth.service.ts
@Injectable()
export class ServiceAuthService {
  private readonly serviceTokens = new Map<string, string>();

  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  async authenticateService(serviceName: string): Promise<string> {
    // Check if we have a cached valid token
    const cachedToken = this.serviceTokens.get(serviceName);
    if (cachedToken && !this.isTokenExpired(cachedToken)) {
      return cachedToken;
    }

    // Get new service token
    const token = await this.getServiceToken(serviceName);
    this.serviceTokens.set(serviceName, token);
    
    return token;
  }

  private async getServiceToken(serviceName: string): Promise<string> {
    const response = await this.httpService.post(
      `${this.configService.get('AUTH_SERVICE_URL')}/api/auth/service-token`,
      {
        service_name: serviceName,
        client_id: this.configService.get(`${serviceName.toUpperCase()}_CLIENT_ID`),
        client_secret: this.configService.get(`${serviceName.toUpperCase()}_CLIENT_SECRET`)
      }
    ).toPromise();

    return response.data.access_token;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = jwt.decode(token) as any;
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }
}

// HTTP Client with Service Authentication
@Injectable()
export class AuthenticatedHttpClient {
  constructor(
    private httpService: HttpService,
    private serviceAuth: ServiceAuthService
  ) {}

  async callService(
    serviceName: string,
    method: string,
    url: string,
    data?: any,
    headers?: any
  ): Promise<any> {
    const token = await this.serviceAuth.authenticateService(serviceName);
    
    const config = {
      method,
      url,
      data,
      headers: {
        ...headers,
        'Authorization': `Bearer ${token}`,
        'X-Service-Name': 'order-service',
        'X-Request-ID': uuidv4()
      }
    };

    try {
      const response = await this.httpService.request(config).toPromise();
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token might be expired, try once more with new token
        this.serviceAuth.invalidateServiceToken(serviceName);
        const newToken = await this.serviceAuth.authenticateService(serviceName);
        config.headers['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await this.httpService.request(config).toPromise();
        return retryResponse.data;
      }
      throw error;
    }
  }
}
```

## 🛡️ API Gateway Security

### Kong API Gateway Security Configuration

```yaml
# Kong Security Plugins
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: jwt-auth
plugin: jwt
config:
  key_claim_name: kid
  secret_is_base64: false
  run_on_preflight: true
  maximum_expiration: 3600

---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limiting
plugin: rate-limiting
config:
  minute: 100
  hour: 1000
  policy: redis
  redis_host: redis-service
  redis_port: 6379
  fault_tolerant: true

---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: cors
plugin: cors
config:
  origins:
  - "https://app.company.com"
  - "https://admin.company.com"
  methods:
  - GET
  - POST
  - PUT
  - DELETE
  - OPTIONS
  headers:
  - Accept
  - Accept-Version
  - Content-Length
  - Content-MD5
  - Content-Type
  - Date
  - Authorization
  exposed_headers:
  - X-Auth-Token
  credentials: true
  max_age: 3600
  preflight_continue: false

---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: ip-restriction
plugin: ip-restriction
config:
  allow:
  - 10.0.0.0/8
  - 172.16.0.0/12
  - 192.168.0.0/16

---
# Service Configuration
apiVersion: v1
kind: Service
metadata:
  name: order-service
  annotations:
    konghq.com/plugins: jwt-auth,rate-limiting,cors
spec:
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: order-service
```

### Istio Security Configuration

```yaml
# JWT Authentication
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: production
spec:
  selector:
    matchLabels:
      app: order-service
  jwtRules:
  - issuer: "https://auth.company.com"
    jwksUri: "https://auth.company.com/.well-known/jwks.json"
    audiences:
    - "api.company.com"
    forwardOriginalToken: true

---
# Authorization Policy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: order-service-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: order-service
  rules:
  # Allow authenticated users to create orders
  - from:
    - source:
        requestPrincipals: ["https://auth.company.com/*"]
    to:
    - operation:
        methods: ["POST"]
        paths: ["/api/orders"]
    when:
    - key: request.auth.claims[roles]
      values: ["user", "admin"]
  
  # Allow only admins to view all orders
  - from:
    - source:
        requestPrincipals: ["https://auth.company.com/*"]
    to:
    - operation:
        methods: ["GET"]
        paths: ["/api/orders"]
    when:
    - key: request.auth.claims[roles]
      values: ["admin"]
  
  # Health check endpoint is public
  - to:
    - operation:
        methods: ["GET"]
        paths: ["/health"]

---
# Rate Limiting
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: rate-limit-filter
  namespace: production
spec:
  workloadSelector:
    labels:
      app: order-service
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
      listener:
        filterChain:
          filter:
            name: "envoy.filters.network.http_connection_manager"
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.local_ratelimit
        typed_config:
          "@type": type.googleapis.com/udpa.type.v1.TypedStruct
          type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
          value:
            stat_prefix: local_rate_limiter
            token_bucket:
              max_tokens: 100
              tokens_per_fill: 100
              fill_interval: 60s
            filter_enabled:
              default_value:
                numerator: 100
                denominator: HUNDRED
            filter_enforced:
              default_value:
                numerator: 100
                denominator: HUNDRED
```

## 🔒 Data Protection & Encryption

### Database Encryption

```typescript
// encryption.service.ts
import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationSalt: string;
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    this.keyDerivationSalt = this.configService.get<string>('KEY_DERIVATION_SALT');
    
    // Derive encryption key from master key
    this.encryptionKey = crypto.pbkdf2Sync(
      masterKey,
      this.keyDerivationSalt,
      100000, // iterations
      32, // key length
      'sha512'
    );
  }

  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('additional-auth-data'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Return iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('additional-auth-data'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
}

// Entity with Field-Level Encryption
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ name: 'encrypted_ssn' })
  @Transformer({
    from: (value: string) => value ? encryptionService.decrypt(value) : null,
    to: (value: string) => value ? encryptionService.encrypt(value) : null
  })
  ssn: string;

  @Column({ name: 'encrypted_credit_card' })
  @Transformer({
    from: (value: string) => value ? encryptionService.decrypt(value) : null,
    to: (value: string) => value ? encryptionService.encrypt(value) : null
  })
  creditCard: string;
}
```

### Secure Communication

```typescript
// secure-http.client.ts
import https from 'https';
import fs from 'fs';

@Injectable()
export class SecureHttpClient {
  private readonly httpsAgent: https.Agent;

  constructor(private configService: ConfigService) {
    // Configure mTLS
    this.httpsAgent = new https.Agent({
      cert: fs.readFileSync(this.configService.get('CLIENT_CERT_PATH')),
      key: fs.readFileSync(this.configService.get('CLIENT_KEY_PATH')),
      ca: fs.readFileSync(this.configService.get('CA_CERT_PATH')),
      rejectUnauthorized: true,
      checkServerIdentity: this.verifyServerIdentity
    });
  }

  private verifyServerIdentity(hostname: string, cert: any): Error | undefined {
    // Custom certificate validation logic
    const allowedServices = ['payment-service', 'inventory-service', 'user-service'];
    const serviceName = cert.subject.CN;

    if (!allowedServices.includes(serviceName)) {
      return new Error(`Unauthorized service: ${serviceName}`);
    }

    // Additional validation...
    return undefined;
  }

  async request(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = https.request({
        ...options,
        agent: this.httpsAgent
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }
}
```

## 🧪 Knowledge Check Quiz

### Question 1
Which JWT algorithm should be used in production for microservices?
a) HS256 (HMAC)
b) RS256 (RSA)
c) None (JWT is insecure)
d) Any symmetric algorithm

<details>
<summary>Answer</summary>
b) RS256 (RSA) - Asymmetric algorithms like RS256 allow services to verify tokens without sharing secret keys, improving security in distributed systems
</details>

### Question 2
What is the main advantage of mTLS over regular TLS?
a) Faster performance
b) Mutual authentication of both client and server
c) Simpler configuration
d) Better compression

<details>
<summary>Answer</summary>
b) Mutual authentication of both client and server - mTLS ensures both parties verify each other's identity, providing stronger security for service-to-service communication
</details>

### Question 3
Which OAuth2 flow is most appropriate for service-to-service authentication?
a) Authorization Code Flow
b) Implicit Flow
c) Client Credentials Flow
d) Resource Owner Password Flow

<details>
<summary>Answer</summary>
c) Client Credentials Flow - This flow is designed specifically for service-to-service authentication where no user interaction is required
</details>

## 🎯 Security Implementation Project

**Task:** Implement a comprehensive security layer for a microservices system

**Requirements:**
1. **Authentication Service**: JWT-based auth with refresh tokens
2. **Authorization**: RBAC and ABAC implementation
3. **API Gateway Security**: Rate limiting, CORS, IP filtering
4. **Service-to-Service**: mTLS or service account authentication
5. **Data Protection**: Field-level encryption for sensitive data
6. **Secret Management**: Vault integration or K8s secrets
7. **Audit Logging**: Security event tracking
8. **Compliance**: GDPR/PII handling

**Deliverables:**
- [ ] Authentication service with OAuth2/OIDC
- [ ] Authorization middleware and policies
- [ ] API gateway security configuration
- [ ] mTLS setup for service communication
- [ ] Data encryption implementation
- [ ] Security audit logging
- [ ] Penetration testing results
- [ ] Security documentation and runbooks

**Next Module:** [Case Studies & Real-World Examples](../07-case-studies/) - Analyze how major companies implement microservices and learn from their successes and failures.