# NestJS Core Concepts Knowledge Summary

## Learning Objectives
This guide provides comprehensive knowledge needed to answer NestJS Core Concepts interview questions (1-15), covering the fundamental building blocks, decorators, dependency injection, modules, controllers, providers, and project structure.

## Core Learning Areas

### 1. What is NestJS? (Q1)

NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It uses TypeScript by default and combines elements of Object-Oriented Programming (OOP), Functional Programming (FP), and Functional Reactive Programming (FRP).

#### Key Features of NestJS
```typescript
// NestJS combines the best concepts from:
// - Angular (Decorators, Dependency Injection, Modules)
// - Express.js (HTTP server foundation)
// - Node.js (Server-side JavaScript runtime)

// Key benefits:
// 1. TypeScript-first approach
// 2. Decorator-based architecture
// 3. Powerful dependency injection system
// 4. Modular structure
// 5. Built-in support for testing
// 6. Extensive ecosystem (GraphQL, WebSockets, Microservices)
// 7. Platform agnostic (Express/Fastify)
```

#### NestJS Philosophy
```typescript
// NestJS follows these principles:
// 1. Heavily inspired by Angular
// 2. Uses decorators extensively
// 3. Dependency injection for loose coupling
// 4. Modular architecture for scalability
// 5. TypeScript for type safety and better developer experience

// Example: Basic NestJS application structure
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

### 2. Main Building Blocks of NestJS (Q2)

NestJS applications are built using several core building blocks that work together to create a structured and maintainable application.

#### The Six Main Building Blocks

#### 1. Modules
```typescript
// Modules organize related functionality
@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

#### 2. Controllers
```typescript
// Controllers handle incoming requests and return responses
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

#### 3. Providers/Services
```typescript
// Providers contain business logic and can be injected
@Injectable()
export class UsersService {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  create(user: CreateUserDto): User {
    const newUser = { id: Date.now(), ...user };
    this.users.push(newUser);
    return newUser;
  }
}
```

#### 4. Middleware
```typescript
// Middleware functions execute before route handlers
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  }
}
```

#### 5. Guards
```typescript
// Guards determine whether a request should be handled
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return this.validateToken(request.headers.authorization);
  }

  private validateToken(token: string): boolean {
    // Token validation logic
    return !!token;
  }
}
```

#### 6. Interceptors
```typescript
// Interceptors can transform requests/responses
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 3. Decorators in NestJS (Q3)

Decorators are a key feature in NestJS, providing metadata and functionality to classes, methods, and properties.

#### Class Decorators
```typescript
// @Module() - Defines a module
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// @Controller() - Defines a controller
@Controller('api/v1/users')
export class UsersController {}

// @Injectable() - Marks class as a provider
@Injectable()
export class UsersService {}

// @Global() - Makes module globally available
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

#### Method Decorators
```typescript
// HTTP Method decorators
@Get()           // GET requests
@Post()          // POST requests
@Put()           // PUT requests
@Delete()        // DELETE requests
@Patch()         // PATCH requests
@Options()       // OPTIONS requests
@Head()          // HEAD requests

// Route parameter decorators
@Get(':id')
findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}

// Custom decorators example
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Roles('admin', 'user')
@UseGuards(RolesGuard)
@Get('protected')
getProtectedResource() {
  return 'Protected resource';
}
```

#### Parameter Decorators
```typescript
@Controller('users')
export class UsersController {
  // @Body() - Extract request body
  @Post()
  create(@Body() createUserDto: CreateUserDto) {}

  // @Param() - Extract route parameters
  @Get(':id')
  findOne(@Param('id') id: string) {}

  // @Query() - Extract query parameters
  @Get()
  findAll(@Query('limit') limit: string, @Query('offset') offset: string) {}

  // @Headers() - Extract headers
  @Get()
  findAll(@Headers('authorization') auth: string) {}

  // @Req() - Access request object
  @Get()
  findAll(@Req() request: Request) {}

  // @Res() - Access response object
  @Get()
  findAll(@Res() response: Response) {}

  // @Session() - Access session
  @Get()
  findAll(@Session() session: any) {}

  // @Ip() - Get client IP
  @Get()
  findAll(@Ip() ip: string) {}
}
```

### 4. Data Transfer Objects (DTOs) (Q4)

DTOs define the structure of data being transferred between different layers of the application.

#### Basic DTO Definition
```typescript
// DTOs define the shape of data
export class CreateUserDto {
  readonly name: string;
  readonly email: string;
  readonly age?: number;
}

export class UpdateUserDto {
  readonly name?: string;
  readonly email?: string;
  readonly age?: number;
}

export class UserResponseDto {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly age?: number;
  readonly createdAt: Date;
}
```

#### DTOs with Validation
```typescript
import { IsEmail, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateUserDto {
  @IsString()
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  readonly age?: number;
}

// Usage in controller
@Post()
@UsePipes(new ValidationPipe())
create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}
```

#### Advanced DTO Patterns
```typescript
// Extending DTOs
export class UpdateUserDto extends PartialType(CreateUserDto) {}

// Intersection types
export class CreateUserWithRoleDto extends IntersectionType(
  CreateUserDto,
  CreateRoleDto,
) {}

// Pick type
export class UserSummaryDto extends PickType(User, ['id', 'name', 'email'] as const) {}

// Omit type
export class CreateUserDto extends OmitType(User, ['id', 'createdAt'] as const) {}

// Custom transformation
export class CreateUserDto {
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsString()
  readonly name: string;

  @Transform(({ value }) => value.toLowerCase())
  @IsEmail()
  readonly email: string;
}
```

### 5. Defining Routes in NestJS (Q5)

Routes in NestJS are defined using decorators on controller methods.

#### Basic Route Definition
```typescript
@Controller('users')
export class UsersController {
  // GET /users
  @Get()
  findAll() {
    return 'This returns all users';
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This returns user #${id}`;
  }

  // POST /users
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return 'This creates a new user';
  }

  // PUT /users/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return `This updates user #${id}`;
  }

  // DELETE /users/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This removes user #${id}`;
  }
}
```

#### Advanced Route Patterns
```typescript
@Controller('api/v1/users')
export class UsersController {
  // Route with multiple parameters
  @Get(':userId/posts/:postId')
  findUserPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return `User ${userId} post ${postId}`;
  }

  // Route with query parameters
  @Get()
  findAll(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @Query('search') search?: string,
  ) {
    return { limit, offset, search };
  }

  // Route with wildcard
  @Get('*')
  findWildcard() {
    return 'Wildcard route';
  }

  // Route with regex pattern
  @Get('files/:filename(.*\\.pdf)')
  downloadPdf(@Param('filename') filename: string) {
    return `Downloading ${filename}`;
  }
}

// Nested routes with sub-controllers
@Controller('users/:userId/posts')
export class UserPostsController {
  @Get()
  findUserPosts(@Param('userId') userId: string) {
    return `Posts for user ${userId}`;
  }
}
```

#### Route Configuration and Middleware
```typescript
// Route-specific middleware and guards
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class AdminController {
  @Get('dashboard')
  @Roles('admin')
  getDashboard() {
    return 'Admin dashboard';
  }

  @Post('users')
  @UsePipes(new ValidationPipe({ transform: true }))
  createUser(@Body() createUserDto: CreateUserDto) {
    return 'Create user';
  }
}

// Global route prefix
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  await app.listen(3000);
}
```

### 6. Dependency Injection in NestJS (Q6)

Dependency Injection (DI) is a design pattern where dependencies are provided to a class rather than created within the class.

#### Basic Dependency Injection
```typescript
// Service (Provider)
@Injectable()
export class UsersService {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  create(user: CreateUserDto): User {
    const newUser = { id: Date.now(), ...user };
    this.users.push(newUser);
    return newUser;
  }
}

// Controller with injected service
@Controller('users')
export class UsersController {
  // Dependency injection via constructor
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}

// Module configuration
@Module({
  controllers: [UsersController],
  providers: [UsersService], // Register provider
})
export class UsersModule {}
```

#### Advanced DI Patterns
```typescript
// Interface-based injection
interface IUserRepository {
  findAll(): User[];
  findById(id: string): User;
}

@Injectable()
export class UserRepository implements IUserRepository {
  findAll(): User[] {
    return [];
  }

  findById(id: string): User {
    return null;
  }
}

// Custom provider with token
const USER_REPOSITORY = 'USER_REPOSITORY';

@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class UsersModule {}

// Inject with custom token
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
  ) {}
}
```

#### Provider Types
```typescript
// 1. Class provider (default)
{
  provide: UsersService,
  useClass: UsersService,
}

// 2. Value provider
{
  provide: 'CONFIG',
  useValue: { apiUrl: 'https://api.example.com' },
}

// 3. Factory provider
{
  provide: 'DATABASE_CONNECTION',
  useFactory: (config: ConfigService) => {
    return createDatabaseConnection(config.getDatabaseUrl());
  },
  inject: [ConfigService],
}

// 4. Existing provider (alias)
{
  provide: 'USERS_SERVICE',
  useExisting: UsersService,
}

// 5. Async factory provider
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async (config: ConfigService) => {
    return await createAsyncConnection(config.getDatabaseUrl());
  },
  inject: [ConfigService],
}
```

### 7. Injection Scopes in NestJS (Q7-8)

Injection scopes determine how long a provider instance lives and when new instances are created.

#### The Three Injection Scopes

#### 1. SINGLETON Scope (Default)
```typescript
// Singleton - One instance per application
@Injectable({ scope: Scope.DEFAULT }) // or just @Injectable()
export class SingletonService {
  private counter = 0;

  increment() {
    return ++this.counter;
  }
}

// All components share the same instance
@Controller('test')
export class TestController {
  constructor(private singletonService: SingletonService) {}

  @Get('counter')
  getCounter() {
    return this.singletonService.increment(); // Increments shared counter
  }
}
```

#### 2. REQUEST Scope
```typescript
// Request - New instance per request
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  private requestId = Math.random().toString(36);

  getRequestId() {
    return this.requestId;
  }
}

// Each HTTP request gets a new instance
@Controller('test')
export class TestController {
  constructor(private requestService: RequestScopedService) {}

  @Get('request-id')
  getRequestId() {
    return this.requestService.getRequestId(); // Different ID per request
  }
}

// Request-scoped providers can access request context
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  constructor(@Inject(REQUEST) private request: Request) {}

  getUserId() {
    return this.request.headers['user-id'];
  }
}
```

#### 3. TRANSIENT Scope
```typescript
// Transient - New instance every time it's injected
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  private instanceId = Math.random().toString(36);

  getInstanceId() {
    return this.instanceId;
  }
}

// Each injection point gets a new instance
@Injectable()
export class ServiceA {
  constructor(private transientService: TransientService) {}

  getId() {
    return this.transientService.getInstanceId();
  }
}

@Injectable()
export class ServiceB {
  constructor(private transientService: TransientService) {}

  getId() {
    return this.transientService.getInstanceId(); // Different instance than ServiceA
  }
}
```

#### Scope Inheritance and Performance
```typescript
// Controllers can also have scopes
@Controller({ path: 'users', scope: Scope.REQUEST })
export class RequestScopedController {
  constructor(private usersService: UsersService) {}
}

// Performance implications:
// SINGLETON: Best performance, shared state
// REQUEST: Medium performance, isolated per request
// TRANSIENT: Lowest performance, new instance every injection

// Scope propagation
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(
    private singletonService: SingletonService, // Still singleton
    private anotherRequestService: AnotherRequestService, // Becomes request-scoped
  ) {}
}
```

### 8. Modules in NestJS (Q9, Q15)

Modules are the basic building blocks of NestJS applications, organizing related functionality.

#### Basic Module Structure
```typescript
@Module({
  imports: [],      // Other modules to import
  controllers: [],  // Controllers in this module
  providers: [],    // Providers available in this module
  exports: [],      // Providers to export to other modules
})
export class UsersModule {}
```

#### Feature Module Example
```typescript
// users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Make service available to other modules
})
export class UsersModule {}

// app.module.ts
@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### Global Modules
```typescript
// @Global() makes providers available throughout the application
@Global()
@Module({
  providers: [
    ConfigService,
    DatabaseService,
  ],
  exports: [ConfigService, DatabaseService],
})
export class CoreModule {
  // Prevent multiple imports
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only once.');
    }
  }
}
```

#### Dynamic Modules
```typescript
// Dynamic module for configuration
@Module({})
export class ConfigModule {
  static forRoot(options: ConfigModuleOptions): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
      global: options.isGlobal ?? false,
    };
  }

  static forFeature(config: Partial<ConfigModuleOptions>): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'FEATURE_CONFIG',
          useValue: config,
        },
      ],
    };
  }
}

// Usage
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule.forFeature({
      type: 'postgres',
      host: 'localhost',
    }),
  ],
})
export class AppModule {}
```

### 9. Controllers in NestJS (Q10)

Controllers handle incoming HTTP requests and return responses to the client.

#### Basic Controller Structure
```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  // POST /users
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }
}
```

#### Advanced Controller Features
```typescript
@Controller('api/v1/users')
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger,
  ) {}

  // Route with multiple decorators
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache')
  async findAll(
    @Query() query: FindUsersDto,
    @Req() request: Request,
  ): Promise<User[]> {
    this.logger.log(`Finding users with query: ${JSON.stringify(query)}`);
    return this.usersService.findAll(query);
  }

  // File upload
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(file);
  }

  // Error handling
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Custom response
  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  exportUsers(@Res() response: Response) {
    const csv = this.usersService.exportToCsv();
    response.send(csv);
  }
}
```

### 10. Providers in NestJS (Q11-12)

Providers are classes that can be injected as dependencies. The `@Injectable()` decorator marks a class as a provider.

#### Basic Provider (Service)
```typescript
// @Injectable() makes the class available for dependency injection
@Injectable()
export class UsersService {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  create(createUserDto: CreateUserDto): User {
    const user = { id: Date.now().toString(), ...createUserDto };
    this.users.push(user);
    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto): User {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException('User not found');
    }
    this.users[userIndex] = { ...this.users[userIndex], ...updateUserDto };
    return this.users[userIndex];
  }

  remove(id: string): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return this.users.length < initialLength;
  }
}
```

#### Different Types of Providers
```typescript
// 1. Repository Provider
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }
}

// 2. Utility Provider
@Injectable()
export class CryptoService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// 3. Configuration Provider
@Injectable()
export class ConfigService {
  private readonly config: Record<string, any>;

  constructor() {
    this.config = {
      port: process.env.PORT || 3000,
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
      },
    };
  }

  get(key: string): any {
    return this.config[key];
  }
}

// 4. Factory Provider
@Injectable()
export class DatabaseService {
  private connection: any;

  async getConnection() {
    if (!this.connection) {
      this.connection = await this.createConnection();
    }
    return this.connection;
  }

  private async createConnection() {
    // Database connection logic
  }
}
```

#### Provider Registration in Modules
```typescript
@Module({
  providers: [
    // Standard class provider
    UsersService,
    
    // Equivalent to:
    {
      provide: UsersService,
      useClass: UsersService,
    },
    
    // Custom token provider
    {
      provide: 'USER_REPOSITORY',
      useClass: UserRepository,
    },
    
    // Value provider
    {
      provide: 'APP_CONFIG',
      useValue: {
        apiUrl: 'https://api.example.com',
        version: '1.0.0',
      },
    },
    
    // Factory provider
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (config: ConfigService) => {
        return await createDatabaseConnection(config.get('database'));
      },
      inject: [ConfigService],
    },
  ],
  exports: [UsersService], // Make available to other modules
})
export class UsersModule {}
```

### 11. Creating a New NestJS Project (Q13)

#### Using NestJS CLI
```bash
# Install NestJS CLI globally
npm install -g @nestjs/cli

# Create new project
nest new project-name

# Choose package manager (npm, yarn, pnpm)
# Project structure will be created automatically

# Alternative: Create with specific package manager
nest new project-name --package-manager npm
nest new project-name --package-manager yarn
nest new project-name --package-manager pnpm

# Create project without installing dependencies
nest new project-name --skip-install
```

#### Manual Project Setup
```bash
# Create directory
mkdir my-nest-app
cd my-nest-app

# Initialize package.json
npm init -y

# Install core dependencies
npm install @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs

# Install dev dependencies
npm install -D @nestjs/cli @nestjs/schematics @nestjs/testing @types/express @types/node typescript ts-node nodemon

# Create tsconfig.json
npx tsc --init

# Create basic file structure
mkdir src
touch src/main.ts src/app.module.ts src/app.controller.ts src/app.service.ts
```

#### Generated Project Structure
```
my-nest-app/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller
│   ├── app.service.ts       # Root service
│   └── app.controller.spec.ts # Controller tests
├── test/                    # E2E tests
├── nest-cli.json           # NestJS CLI configuration
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

### 12. Purpose of main.ts File (Q14)

The `main.ts` file is the entry point of a NestJS application where the application is created and started.

#### Basic main.ts Structure
```typescript
// main.ts - Application bootstrap file
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule);
  
  // Start listening on port 3000
  await app.listen(3000);
}

// Start the application
bootstrap();
```

#### Advanced main.ts Configuration
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create application with specific platform
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Configure logging levels
    cors: true, // Enable CORS
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('users')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS configuration
  app.enableCors({
    origin: ['http://localhost:3000', 'https://mydomain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Get port from environment or use default
  const port = process.env.PORT || 3000;
  
  // Start server
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch(error => {
  console.error('Error starting application:', error);
  process.exit(1);
});
```

#### Platform-Specific Configuration
```typescript
// Using Fastify instead of Express
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  
  await app.listen(3000, '0.0.0.0');
}

bootstrap();
```

## Study Plan Recommendations

### Phase 1: Core Fundamentals (Days 1-3)
- Understand NestJS philosophy and architecture
- Master decorators and their usage
- Practice basic dependency injection
- Learn module, controller, and service creation

### Phase 2: Advanced Concepts (Days 4-6)
- Deep dive into injection scopes and their implications
- Master DTO creation and validation
- Practice route definition and parameter handling
- Understand provider types and registration

### Phase 3: Project Structure (Days 7-8)
- Learn project creation and organization
- Master main.ts configuration options
- Practice module organization and imports/exports
- Understand global vs feature modules

### Phase 4: Best Practices (Days 9-10)
- Study real-world application architecture
- Practice error handling and validation
- Learn testing strategies for each component
- Master configuration and environment management

## Key NestJS Principles

### 1. **Decorator-Based Architecture**
- Extensive use of decorators for metadata
- Clean separation of concerns
- Declarative programming style

### 2. **Dependency Injection System**
- Loose coupling between components
- Testable and maintainable code
- Flexible provider registration

### 3. **Modular Structure**
- Organized feature-based modules
- Clear boundaries and dependencies
- Scalable application architecture

### 4. **TypeScript Integration**
- Type safety throughout the application
- Better developer experience
- Enhanced IDE support

### 5. **Platform Agnostic**
- Support for Express and Fastify
- Consistent API regardless of platform
- Easy platform switching

This comprehensive knowledge foundation will enable you to confidently answer all NestJS Core Concepts interview questions (1-15), demonstrating both theoretical understanding and practical implementation skills.