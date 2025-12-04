# NestJS Advanced Request Handling Knowledge Summary (Q31-45)

## Table of Contents
1. [Pipes](#pipes)
2. [Guards](#guards)
3. [Interceptors](#interceptors)
4. [Filters](#filters)
5. [Request Lifecycle](#request-lifecycle)
6. [Authentication & Authorization](#authentication--authorization)
7. [Practical Examples](#practical-examples)
8. [Best Practices](#best-practices)
9. [Study Plan](#study-plan)

---

## Pipes

### What are Pipes? (Q31)

Pipes are classes that implement the `PipeTransform` interface. They serve two main purposes:
- **Transformation**: Transform input data to desired output
- **Validation**: Evaluate input data and throw exceptions if invalid

**Basic Pipe Structure:**
```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class CustomPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Transform or validate the value
    return value;
  }
}
```

### Built-in Pipes

#### ValidationPipe (Q36)

The `ValidationPipe` automatically validates incoming requests against DTO classes using decorators.

**Basic Usage:**
```typescript
// Global setup in main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}

// DTO with validation decorators
import { IsString, IsEmail, IsNumber, Min, Max } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(18)
  @Max(120)
  age: number;
}

// Controller usage
@Controller('users')
export class UsersController {
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

**Advanced ValidationPipe Configuration:**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,        // Strip non-whitelisted properties
  forbidNonWhitelisted: true,  // Throw error for non-whitelisted properties
  transform: true,        // Auto-transform payloads to DTO instances
  disableErrorMessages: false, // Show validation error messages
  validationError: {
    target: false,        // Don't include target in error
    value: false,         // Don't include value in error
  },
}));
```

#### ParseIntPipe (Q37)

The `ParseIntPipe` validates and transforms string parameters to integers.

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // With custom error message
  @Get('custom/:id')
  findOneCustom(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number
  ) {
    return this.usersService.findOne(id);
  }
}
```

**Other Built-in Pipes:**
```typescript
import { 
  ParseIntPipe, 
  ParseFloatPipe, 
  ParseBoolPipe, 
  ParseArrayPipe, 
  ParseUUIDPipe,
  ParseEnumPipe,
  DefaultValuePipe
} from '@nestjs/common';

@Controller('examples')
export class ExamplesController {
  @Get('number/:id')
  getNumber(@Param('id', ParseIntPipe) id: number) {
    return { id };
  }

  @Get('float/:value')
  getFloat(@Param('value', ParseFloatPipe) value: number) {
    return { value };
  }

  @Get('bool/:active')
  getBool(@Param('active', ParseBoolPipe) active: boolean) {
    return { active };
  }

  @Get('uuid/:id')
  getUUID(@Param('id', ParseUUIDPipe) id: string) {
    return { id };
  }

  @Get('array')
  getArray(@Query('ids', new ParseArrayPipe({ items: Number })) ids: number[]) {
    return { ids };
  }

  @Get('enum/:status')
  getEnum(@Param('status', new ParseEnumPipe(['active', 'inactive'])) status: string) {
    return { status };
  }

  @Get('default')
  getDefault(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return { page };
  }
}
```

### Custom Pipes (Q38)

**Validation Pipe Example:**
```typescript
import { 
  PipeTransform, 
  Injectable, 
  ArgumentMetadata, 
  BadRequestException 
} from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed. Numeric string expected.');
    }
    
    if (val <= 0) {
      throw new BadRequestException('Value must be positive.');
    }
    
    return val;
  }
}

// Usage
@Controller('products')
export class ProductsController {
  @Get(':id')
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.productsService.findOne(id);
  }
}
```

**Transformation Pipe Example:**
```typescript
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return value.trim();
    }
    
    if (typeof value === 'object' && value !== null) {
      const trimmedObj = {};
      for (const key in value) {
        trimmedObj[key] = typeof value[key] === 'string' 
          ? value[key].trim() 
          : value[key];
      }
      return trimmedObj;
    }
    
    return value;
  }
}

// Usage
@Controller('users')
export class UsersController {
  @Post()
  create(@Body(TrimPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

---

## Guards

### What are Guards? (Q32)

Guards are classes that implement the `CanActivate` interface. They determine whether a request should be processed or rejected based on certain conditions (authentication, authorization, etc.).

**Basic Guard Structure:**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // Implement guard logic
    return true; // or false
  }
}
```

### Custom Guards (Q39)

#### Authentication Guard
```typescript
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// Usage
@Controller('protected')
@UseGuards(AuthGuard)
export class ProtectedController {
  @Get()
  getProtectedData() {
    return { message: 'This is protected data' };
  }
}
```

#### Role-based Authorization Guard
```typescript
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

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
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    
    const hasRole = requiredRoles.some(role => user.roles?.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return true;
  }
}

// Usage
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles('admin', 'moderator')
  getUsers() {
    return this.usersService.findAll();
  }

  @Delete('users/:id')
  @Roles('admin')
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

#### API Key Guard
```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }
    
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }
    
    return true;
  }
}
```

---

## Interceptors

### What are Interceptors? (Q33)

Interceptors are classes that implement the `NestInterceptor` interface. They can:
- Bind extra logic before/after method execution
- Transform the result returned from a method
- Transform exceptions thrown from a method
- Extend basic function behavior

### Middleware vs Interceptors (Q34)

| Middleware | Interceptors |
|------------|-------------|
| Execute before route handler | Execute before AND after route handler |
| Cannot access route handler context | Full access to ExecutionContext |
| Process raw request/response | Can transform request/response |
| Express/Fastify specific | Platform agnostic |
| Cannot modify return value | Can transform return value |
| Simple function or class | Must implement NestInterceptor |

### Custom Interceptors (Q40)

#### Logging Interceptor
```typescript
import { 
  Injectable, 
  NestInterceptor, 
  ExecutionContext, 
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    this.logger.log(`Incoming Request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`Request completed: ${method} ${url} - ${Date.now() - now}ms`);
      }),
    );
  }
}
```

#### Transform Response Interceptor
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
```

#### Cache Interceptor
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = `${request.method}:${request.url}`;

    if (request.method === 'GET' && this.cache.has(key)) {
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap(response => {
        if (request.method === 'GET') {
          this.cache.set(key, response);
        }
      }),
    );
  }
}
```

#### Error Handling Interceptor
```typescript
import { 
  Injectable, 
  NestInterceptor, 
  ExecutionContext, 
  CallHandler,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorsInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(err => {
        this.logger.error(`Error occurred: ${err.message}`, err.stack);
        
        if (err instanceof HttpException) {
          return throwError(() => err);
        }
        
        return throwError(() => new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR
        ));
      }),
    );
  }
}
```

---

## Filters

### What are Filters? (Q35)

Exception filters are responsible for handling all exceptions across the application. They catch exceptions and control the exact response sent to the client.

**Basic Filter Structure:**
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

**Advanced Exception Filter:**
```typescript
import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message = typeof errorResponse === 'string' 
        ? errorResponse 
        : (errorResponse as any).message || exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json(errorResponse);
  }
}
```

---

## Request Lifecycle

### Request Lifecycle Order (Q41, Q42)

The request lifecycle in NestJS follows this order:

1. **Middleware** - Express/Fastify middleware
2. **Guards** - Authentication/Authorization
3. **Interceptors (pre-controller)** - Before method execution
4. **Pipes** - Validation/Transformation
5. **Controller Method** - Route handler execution
6. **Interceptors (post-controller)** - After method execution
7. **Exception Filters** - Error handling

```typescript
// Example showing all components
@Controller('example')
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor, ResponseTransformInterceptor)
export class ExampleController {
  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createDto: CreateExampleDto) {
    return this.exampleService.create(createDto);
  }
}

// Middleware in main.ts or module
function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log('1. Middleware executed');
  next();
}

// The execution order will be:
// 1. Middleware
// 2. AuthGuard
// 3. RolesGuard
// 4. LoggingInterceptor (before)
// 5. ResponseTransformInterceptor (before)
// 6. ValidationPipe
// 7. Controller method
// 8. ResponseTransformInterceptor (after)
// 9. LoggingInterceptor (after)
// 10. Exception filters (if error occurs)
```

**Detailed Lifecycle Visualization:**
```typescript
// middleware.ts
export function RequestLogger(req: Request, res: Response, next: NextFunction) {
  console.log('1. 🔄 Middleware: Request received');
  next();
}

// auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    console.log('2. 🛡️ Guard: Checking authentication');
    return true;
  }
}

// logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('3. 🔍 Interceptor: Before controller');
    
    return next.handle().pipe(
      tap(() => console.log('6. 🔍 Interceptor: After controller'))
    );
  }
}

// validation.pipe.ts
@Injectable()
export class CustomValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('4. 🔧 Pipe: Validating/transforming data');
    return value;
  }
}

// example.controller.ts
@Controller('example')
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class ExampleController {
  @Post()
  create(@Body(CustomValidationPipe) dto: any) {
    console.log('5. 🎯 Controller: Executing business logic');
    return { message: 'Success' };
  }
}
```

---

## Authentication & Authorization

### Authentication vs Authorization (Q45)

**Authentication** - Verifies WHO the user is
**Authorization** - Verifies WHAT the user can do

### Authentication Implementation (Q43)

#### JWT Authentication Setup
```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Replace with actual user lookup
    const user = await this.findUser(username);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles,
      },
    };
  }

  private async findUser(username: string) {
    // Mock user - replace with database lookup
    return {
      id: 1,
      username: 'admin',
      password: await bcrypt.hash('password', 10),
      roles: ['admin', 'user'],
    };
  }
}

// jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
    };
  }
}

// auth.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    return this.authService.login(user);
  }
}
```

#### Passport JWT Guard
```typescript
// jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Usage in controllers
import { UseGuards } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}
```

### Authorization Implementation (Q44)

#### Role-Based Access Control (RBAC)
```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
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

// Usage in controller
@Controller('admin')
export class AdminController {
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  getReports() {
    return this.reportsService.findAll();
  }
}
```

#### Resource-Based Authorization
```typescript
// ownership.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // Check if user owns the resource or is admin
    if (user.roles.includes('admin')) {
      return true;
    }

    const resource = await this.usersService.findOne(resourceId);
    
    if (resource.userId !== user.userId) {
      throw new ForbiddenException('You can only access your own resources');
    }

    return true;
  }
}

// Usage
@Controller('users')
export class UsersController {
  @Get(':id/profile')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  getUserProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }
}
```

---

## Practical Examples

### Complete Request Processing Example

```typescript
// Complete example showing all components working together

// dto/create-post.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  category?: string;
}

// pipes/slug.pipe.ts
@Injectable()
export class SlugifyPipe implements PipeTransform {
  transform(value: CreatePostDto): CreatePostDto {
    if (value.title) {
      value.slug = value.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    return value;
  }
}

// guards/post-ownership.guard.ts
@Injectable()
export class PostOwnershipGuard implements CanActivate {
  constructor(private postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const postId = request.params.id;

    if (user.roles.includes('admin')) {
      return true;
    }

    const post = await this.postsService.findOne(postId);
    return post.authorId === user.userId;
  }
}

// interceptors/add-metadata.interceptor.ts
@Injectable()
export class AddMetadataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      map(data => ({
        ...data,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: request.user?.userId,
          ipAddress: request.ip,
        },
      })),
    );
  }
}

// posts.controller.ts
@Controller('posts')
@UseFilters(AllExceptionsFilter)
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor, AddMetadataInterceptor)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(RolesGuard)
  @UsePipes(SlugifyPipe, ValidationPipe)
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postsService.create({
      ...createPostDto,
      authorId: req.user.userId,
    });
  }

  @Put(':id')
  @UseGuards(PostOwnershipGuard)
  @UsePipes(SlugifyPipe, ValidationPipe)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: Partial<CreatePostDto>
  ) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard, PostOwnershipGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }
}

// Request flow for POST /posts:
// 1. Middleware (logging, CORS, etc.)
// 2. JwtAuthGuard (verify JWT token)
// 3. RolesGuard (check user has USER or ADMIN role)
// 4. LoggingInterceptor (before) - log incoming request
// 5. AddMetadataInterceptor (before) - prepare to add metadata
// 6. SlugifyPipe - transform title to slug
// 7. ValidationPipe - validate DTO
// 8. Controller method - create post
// 9. AddMetadataInterceptor (after) - add metadata to response
// 10. LoggingInterceptor (after) - log completion
// 11. Exception filters (if any errors)
```

---

## Best Practices

### 1. Proper Component Separation
```typescript
// ✅ Good - Single responsibility
@Injectable()
export class AuthenticationGuard implements CanActivate {
  // Only handles authentication
}

@Injectable()
export class AuthorizationGuard implements CanActivate {
  // Only handles authorization
}

// ❌ Bad - Mixed responsibilities
@Injectable()
export class AuthGuard implements CanActivate {
  // Handles both auth and authz - too much responsibility
}
```

### 2. Guard Composition
```typescript
// ✅ Good - Composable guards
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  // Guards are applied in order and separated by concern
}

// ✅ Better - Custom composed guard
@Injectable()
export class AdminGuard extends AuthGuard(['jwt']) {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    
    const request = context.switchToHttp().getRequest();
    return request.user?.roles?.includes('admin');
  }
}
```

### 3. Error Handling
```typescript
// ✅ Good - Specific error handling
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    if (!request.headers.authorization) {
      throw new UnauthorizedException('Authorization header required');
    }
    
    if (!this.isValidToken(request.headers.authorization)) {
      throw new UnauthorizedException('Invalid token');
    }
    
    return true;
  }
}
```

### 4. Performance Considerations
```typescript
// ✅ Good - Cached validation
@Injectable()
export class CachedValidationPipe implements PipeTransform {
  private cache = new Map();

  transform(value: any, metadata: ArgumentMetadata) {
    const cacheKey = JSON.stringify(value);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const result = this.validate(value);
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

---

## Study Plan

### Week 1: Pipes & Validation
- **Days 1-2**: Built-in pipes (ValidationPipe, ParseIntPipe, etc.)
- **Days 3-4**: Custom pipe creation and transformation
- **Days 5-7**: Advanced validation with class-validator

### Week 2: Guards & Security
- **Days 1-3**: Authentication guards and JWT implementation
- **Days 4-5**: Authorization and role-based access control
- **Days 6-7**: Custom guards and security patterns

### Week 3: Interceptors & Filters
- **Days 1-3**: Interceptor creation and response transformation
- **Days 4-5**: Exception filters and error handling
- **Days 6-7**: Advanced interceptor patterns

### Week 4: Integration & Best Practices
- **Days 1-3**: Request lifecycle and component interaction
- **Days 4-5**: Performance optimization
- **Days 6-7**: Real-world application patterns

### Hands-On Projects:
1. **User Management System** - Full auth/authz with RBAC
2. **Blog API** - Content management with ownership controls
3. **E-commerce API** - Complex business rules and validation

### Key Concepts to Master:
- **Execution Order**: Understand the request lifecycle completely
- **Component Purpose**: Know when to use pipes vs guards vs interceptors
- **Error Handling**: Implement comprehensive exception strategies
- **Security**: Authentication and authorization patterns
- **Performance**: Caching and optimization techniques
- **Testing**: Unit and integration testing for all components

This comprehensive guide covers all aspects of advanced request handling in NestJS, providing you with the knowledge needed to answer questions 31-45 confidently in technical interviews.