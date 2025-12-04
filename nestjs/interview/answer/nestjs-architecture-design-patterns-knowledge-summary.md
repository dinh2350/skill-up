# NestJS Architecture & Design Patterns Knowledge Summary (Q71-85)

## Table of Contents
1. [Dynamic Modules](#dynamic-modules)
2. [Module Registration Methods](#module-registration-methods)
3. [Custom Decorators](#custom-decorators)
4. [Design Patterns](#design-patterns)
5. [CQRS Pattern](#cqrs-pattern)
6. [Event Sourcing](#event-sourcing)
7. [Domain-Driven Design (DDD)](#domain-driven-design-ddd)
8. [Advanced Architectural Patterns](#advanced-architectural-patterns)
9. [Best Practices](#best-practices)
10. [Study Plan](#study-plan)

---

## Dynamic Modules

### What are Dynamic Modules? (Q71)

Dynamic modules are modules that can be configured at runtime with different options. They allow you to create flexible, reusable modules that can adapt to different configurations and environments.

**Basic Dynamic Module Structure:**
```typescript
import { Module, DynamicModule } from '@nestjs/common';

export interface ConfigModuleOptions {
  envFilePath?: string;
  isGlobal?: boolean;
  validationSchema?: any;
}

@Module({})
export class ConfigModule {
  static register(options: ConfigModuleOptions): DynamicModule {
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
      global: options.isGlobal,
    };
  }

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
      global: options.isGlobal,
    };
  }
}
```

**Advanced Dynamic Module with Factory:**
```typescript
export interface DatabaseModuleOptions {
  type: 'mysql' | 'postgres' | 'mongodb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface DatabaseModuleAsyncOptions {
  imports?: any[];
  useFactory?: (...args: any[]) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
  inject?: any[];
}

@Module({})
export class DatabaseModule {
  static register(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_OPTIONS',
          useValue: options,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }

  static forRootAsync(options: DatabaseModuleAsyncOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'DATABASE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }

  static forFeature(entities: any[]): DynamicModule {
    const providers = entities.map(entity => ({
      provide: `${entity.name}Repository`,
      useFactory: (connection: any) => connection.getRepository(entity),
      inject: ['DATABASE_CONNECTION'],
    }));

    return {
      module: DatabaseModule,
      providers,
      exports: providers,
    };
  }
}
```

---

## Module Registration Methods

### Differences Between register(), forRoot(), and forFeature() (Q72)

Each method serves a specific purpose in module configuration:

| Method | Purpose | Usage | Typical Configuration |
|--------|---------|--------|----------------------|
| `register()` | Simple module configuration | One-time setup | Basic options |
| `forRoot()` | Root module configuration | App-level setup | Global configuration |
| `forFeature()` | Feature-specific configuration | Module-specific setup | Local features |

**register() Method:**
```typescript
// Simple configuration for immediate use
@Module({})
export class LoggerModule {
  static register(options: LoggerOptions): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: 'LOGGER_OPTIONS',
          useValue: options,
        },
        LoggerService,
      ],
      exports: [LoggerService],
    };
  }
}

// Usage
@Module({
  imports: [
    LoggerModule.register({
      level: 'debug',
      format: 'json',
    }),
  ],
})
export class AppModule {}
```

**forRoot() Method:**
```typescript
// Root-level configuration, typically used once per application
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useValue: options,
        },
        CacheService,
      ],
      exports: [CacheService],
      global: true, // Usually global
    };
  }
}

// Usage in AppModule
@Module({
  imports: [
    CacheModule.forRoot({
      host: 'localhost',
      port: 6379,
      ttl: 300,
    }),
  ],
})
export class AppModule {}
```

**forFeature() Method:**
```typescript
// Feature-specific configuration, used in feature modules
@Module({})
export class TypeOrmModule {
  static forFeature(entities: EntityClassOrSchema[]): DynamicModule {
    const providers = entities.map(entity => ({
      provide: getRepositoryToken(entity),
      useFactory: (connection: Connection) => connection.getRepository(entity),
      inject: [getConnectionToken()],
    }));

    return {
      module: TypeOrmModule,
      providers,
      exports: providers,
    };
  }
}

// Usage in feature modules
@Module({
  imports: [TypeOrmModule.forFeature([User, Profile])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

### forRootAsync() Usage (Q73)

`forRootAsync()` allows asynchronous configuration, typically used when configuration depends on external services or environment setup.

**Basic forRootAsync:**
```typescript
@Module({})
export class ConfigModule {
  static forRootAsync(options: ConfigModuleAsyncOptions): DynamicModule {
    return {
      module: ConfigModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        ConfigService,
      ],
      exports: [ConfigService],
      global: options.isGlobal,
    };
  }
}

// Usage with external service
@Module({
  imports: [
    ConfigModule.forRootAsync({
      imports: [HttpModule],
      useFactory: async (httpService: HttpService) => {
        const response = await httpService.get('https://config-service.com/config').toPromise();
        return response.data;
      },
      inject: [HttpService],
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

**Advanced Async Configuration:**
```typescript
export interface DatabaseAsyncOptions {
  imports?: any[];
  useClass?: Type<DatabaseOptionsFactory>;
  useExisting?: Type<DatabaseOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<DatabaseOptions> | DatabaseOptions;
  inject?: any[];
}

export interface DatabaseOptionsFactory {
  createDatabaseOptions(): Promise<DatabaseOptions> | DatabaseOptions;
}

@Module({})
export class DatabaseModule {
  static forRootAsync(options: DatabaseAsyncOptions): DynamicModule {
    const providers: Provider[] = [];

    if (options.useFactory) {
      providers.push({
        provide: 'DATABASE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      });
    }

    if (options.useClass) {
      providers.push(
        {
          provide: 'DATABASE_OPTIONS',
          useFactory: async (optionsFactory: DatabaseOptionsFactory) =>
            await optionsFactory.createDatabaseOptions(),
          inject: [options.useClass],
        },
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      );
    }

    if (options.useExisting) {
      providers.push({
        provide: 'DATABASE_OPTIONS',
        useFactory: async (optionsFactory: DatabaseOptionsFactory) =>
          await optionsFactory.createDatabaseOptions(),
        inject: [options.useExisting],
      });
    }

    return {
      module: DatabaseModule,
      imports: options.imports || [],
      providers: [...providers, DatabaseService],
      exports: [DatabaseService],
    };
  }
}
```

---

## Custom Decorators

### Creating Custom Decorators (Q74)

Custom decorators encapsulate metadata and provide reusable functionality.

**Parameter Decorators:**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Extract user from request
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Extract specific user property
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);

// Extract with validation
export const ValidatedUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return data ? user[data] : user;
  },
);

// Usage in controller
@Controller('users')
export class UsersController {
  @Get('profile')
  getProfile(@User() user: UserEntity) {
    return user;
  }

  @Get('dashboard')
  getDashboard(@UserId() userId: number) {
    return this.usersService.getDashboard(userId);
  }

  @Get('settings')
  getSettings(@ValidatedUser('email') email: string) {
    return { email };
  }
}
```

**Method Decorators:**
```typescript
import { SetMetadata } from '@nestjs/common';

// Roles decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Permissions decorator
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// Cache decorator
export const CacheResult = (ttl: number = 300) =>
  SetMetadata('cache', { ttl });

// Rate limit decorator
export const RateLimit = (limit: number, window: number) =>
  SetMetadata('rateLimit', { limit, window });

// Usage
@Controller('admin')
export class AdminController {
  @Get('users')
  @Roles('admin', 'moderator')
  @CacheResult(600)
  getUsers() {
    return this.usersService.findAll();
  }

  @Post('sensitive-action')
  @RequirePermissions('write', 'admin')
  @RateLimit(5, 60) // 5 requests per minute
  performSensitiveAction() {
    return { message: 'Action performed' };
  }
}
```

**Class Decorators:**
```typescript
// API versioning decorator
export const ApiVersion = (version: string) =>
  SetMetadata('version', version);

// Feature flag decorator
export const FeatureFlag = (flag: string) =>
  SetMetadata('featureFlag', flag);

// Resource decorator
export const Resource = (resource: string) =>
  SetMetadata('resource', resource);

// Usage
@Controller('users')
@ApiVersion('v2')
@FeatureFlag('user-management')
@Resource('users')
export class UsersV2Controller {
  // Controller methods
}
```

**Property Decorators:**
```typescript
// Custom injection decorators
export const InjectRepository = (entity: any) =>
  Inject(getRepositoryToken(entity));

export const InjectCache = () =>
  Inject('CACHE_MANAGER');

export const InjectLogger = (context?: string) =>
  Inject(`Logger${context ? `_${context}` : ''}`);

// Usage
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectCache() private cacheManager: Cache,
    @InjectLogger('UsersService') private logger: Logger,
  ) {}
}
```

**Complex Custom Decorator:**
```typescript
import { applyDecorators, UseGuards, SetMetadata, UseInterceptors } from '@nestjs/common';

// Composite decorator combining multiple decorators
export function SecureEndpoint(roles: string[], permissions: string[] = []) {
  return applyDecorators(
    SetMetadata('roles', roles),
    SetMetadata('permissions', permissions),
    UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard),
    UseInterceptors(LoggingInterceptor),
  );
}

// Usage
@Controller('admin')
export class AdminController {
  @Get('sensitive-data')
  @SecureEndpoint(['admin'], ['read:sensitive'])
  getSensitiveData() {
    return this.adminService.getSensitiveData();
  }
}
```

---

## Design Patterns

### Repository Pattern (Q75)

The Repository pattern provides an abstraction layer over data access logic.

**Basic Repository Interface:**
```typescript
// interfaces/repository.interface.ts
export interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string | number): Promise<T | null>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string | number, entity: Partial<T>): Promise<T>;
  delete(id: string | number): Promise<void>;
}

// repositories/base.repository.ts
export abstract class BaseRepository<T> implements IRepository<T> {
  constructor(protected readonly model: any) {}

  abstract findAll(): Promise<T[]>;
  abstract findById(id: string | number): Promise<T | null>;
  abstract create(entity: Partial<T>): Promise<T>;
  abstract update(id: string | number, entity: Partial<T>): Promise<T>;
  abstract delete(id: string | number): Promise<void>;
}
```

**TypeORM Repository Implementation:**
```typescript
// repositories/user.repository.ts
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super(userRepo);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: ['profile', 'posts'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['profile', 'posts'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepo.create(userData);
    return this.userRepo.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    await this.userRepo.update(id, userData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userRepo.find({
      where: { isActive: true },
      relations: ['profile'],
    });
  }

  async search(query: string, page: number = 1, limit: number = 10): Promise<[User[], number]> {
    const queryBuilder = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.firstName ILIKE :query', { query: `%${query}%` })
      .orWhere('user.lastName ILIKE :query', { query: `%${query}%` })
      .orWhere('user.email ILIKE :query', { query: `%${query}%` })
      .skip((page - 1) * limit)
      .take(limit);

    return queryBuilder.getManyAndCount();
  }
}
```

### Factory Pattern (Q76)

The Factory pattern creates objects without specifying their exact class.

**Basic Factory Implementation:**
```typescript
// interfaces/notification.interface.ts
export interface INotificationService {
  send(message: string, recipient: string): Promise<void>;
}

// services/email-notification.service.ts
@Injectable()
export class EmailNotificationService implements INotificationService {
  async send(message: string, recipient: string): Promise<void> {
    console.log(`Sending email to ${recipient}: ${message}`);
    // Email implementation
  }
}

// services/sms-notification.service.ts
@Injectable()
export class SmsNotificationService implements INotificationService {
  async send(message: string, recipient: string): Promise<void> {
    console.log(`Sending SMS to ${recipient}: ${message}`);
    // SMS implementation
  }
}

// services/push-notification.service.ts
@Injectable()
export class PushNotificationService implements INotificationService {
  async send(message: string, recipient: string): Promise<void> {
    console.log(`Sending push notification to ${recipient}: ${message}`);
    // Push notification implementation
  }
}
```

**Notification Factory:**
```typescript
// enums/notification-type.enum.ts
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

// factories/notification.factory.ts
@Injectable()
export class NotificationFactory {
  constructor(
    private readonly emailService: EmailNotificationService,
    private readonly smsService: SmsNotificationService,
    private readonly pushService: PushNotificationService,
  ) {}

  create(type: NotificationType): INotificationService {
    switch (type) {
      case NotificationType.EMAIL:
        return this.emailService;
      case NotificationType.SMS:
        return this.smsService;
      case NotificationType.PUSH:
        return this.pushService;
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }
  }
}

// services/notification.service.ts
@Injectable()
export class NotificationService {
  constructor(private readonly notificationFactory: NotificationFactory) {}

  async sendNotification(
    type: NotificationType,
    message: string,
    recipient: string,
  ): Promise<void> {
    const notificationService = this.notificationFactory.create(type);
    await notificationService.send(message, recipient);
  }

  async sendMultipleNotifications(
    types: NotificationType[],
    message: string,
    recipient: string,
  ): Promise<void> {
    const promises = types.map(type => {
      const service = this.notificationFactory.create(type);
      return service.send(message, recipient);
    });

    await Promise.all(promises);
  }
}
```

**Advanced Factory with Provider Pattern:**
```typescript
// providers/notification-provider.factory.ts
export const NotificationProviderFactory = {
  provide: 'NOTIFICATION_FACTORY',
  useFactory: (
    emailService: EmailNotificationService,
    smsService: SmsNotificationService,
    pushService: PushNotificationService,
  ) => {
    return new Map<NotificationType, INotificationService>([
      [NotificationType.EMAIL, emailService],
      [NotificationType.SMS, smsService],
      [NotificationType.PUSH, pushService],
    ]);
  },
  inject: [EmailNotificationService, SmsNotificationService, PushNotificationService],
};

// Usage
@Injectable()
export class EnhancedNotificationService {
  constructor(
    @Inject('NOTIFICATION_FACTORY')
    private readonly notificationMap: Map<NotificationType, INotificationService>,
  ) {}

  async sendNotification(
    type: NotificationType,
    message: string,
    recipient: string,
  ): Promise<void> {
    const service = this.notificationMap.get(type);
    if (!service) {
      throw new Error(`No service found for type: ${type}`);
    }
    await service.send(message, recipient);
  }
}
```

### Strategy Pattern (Q77)

The Strategy pattern defines a family of algorithms and makes them interchangeable.

**Payment Strategy Implementation:**
```typescript
// interfaces/payment-strategy.interface.ts
export interface IPaymentStrategy {
  pay(amount: number, paymentData: any): Promise<PaymentResult>;
  validate(paymentData: any): boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

// strategies/credit-card-payment.strategy.ts
@Injectable()
export class CreditCardPaymentStrategy implements IPaymentStrategy {
  async pay(amount: number, paymentData: any): Promise<PaymentResult> {
    // Credit card payment implementation
    console.log(`Processing credit card payment of $${amount}`);
    
    return {
      success: true,
      transactionId: `cc_${Date.now()}`,
      message: 'Credit card payment processed successfully',
    };
  }

  validate(paymentData: any): boolean {
    return paymentData.cardNumber && paymentData.cvv && paymentData.expiryDate;
  }
}

// strategies/paypal-payment.strategy.ts
@Injectable()
export class PaypalPaymentStrategy implements IPaymentStrategy {
  async pay(amount: number, paymentData: any): Promise<PaymentResult> {
    // PayPal payment implementation
    console.log(`Processing PayPal payment of $${amount}`);
    
    return {
      success: true,
      transactionId: `pp_${Date.now()}`,
      message: 'PayPal payment processed successfully',
    };
  }

  validate(paymentData: any): boolean {
    return paymentData.email && paymentData.password;
  }
}

// strategies/bank-transfer-payment.strategy.ts
@Injectable()
export class BankTransferPaymentStrategy implements IPaymentStrategy {
  async pay(amount: number, paymentData: any): Promise<PaymentResult> {
    // Bank transfer implementation
    console.log(`Processing bank transfer of $${amount}`);
    
    return {
      success: true,
      transactionId: `bt_${Date.now()}`,
      message: 'Bank transfer initiated successfully',
    };
  }

  validate(paymentData: any): boolean {
    return paymentData.accountNumber && paymentData.routingNumber;
  }
}
```

**Payment Context (Strategy Context):**
```typescript
// enums/payment-method.enum.ts
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
}

// services/payment.service.ts
@Injectable()
export class PaymentService {
  private readonly strategies = new Map<PaymentMethod, IPaymentStrategy>();

  constructor(
    private readonly creditCardStrategy: CreditCardPaymentStrategy,
    private readonly paypalStrategy: PaypalPaymentStrategy,
    private readonly bankTransferStrategy: BankTransferPaymentStrategy,
  ) {
    this.strategies.set(PaymentMethod.CREDIT_CARD, this.creditCardStrategy);
    this.strategies.set(PaymentMethod.PAYPAL, this.paypalStrategy);
    this.strategies.set(PaymentMethod.BANK_TRANSFER, this.bankTransferStrategy);
  }

  async processPayment(
    method: PaymentMethod,
    amount: number,
    paymentData: any,
  ): Promise<PaymentResult> {
    const strategy = this.strategies.get(method);
    
    if (!strategy) {
      throw new Error(`Payment method ${method} is not supported`);
    }

    if (!strategy.validate(paymentData)) {
      throw new Error(`Invalid payment data for method ${method}`);
    }

    return strategy.pay(amount, paymentData);
  }

  getSupportedMethods(): PaymentMethod[] {
    return Array.from(this.strategies.keys());
  }
}
```

**Dynamic Strategy Selection:**
```typescript
// services/dynamic-payment.service.ts
@Injectable()
export class DynamicPaymentService {
  constructor(private readonly moduleRef: ModuleRef) {}

  async processPayment(
    method: PaymentMethod,
    amount: number,
    paymentData: any,
  ): Promise<PaymentResult> {
    const strategyClass = this.getStrategyClass(method);
    const strategy = this.moduleRef.get(strategyClass, { strict: false });

    if (!strategy.validate(paymentData)) {
      throw new Error(`Invalid payment data for method ${method}`);
    }

    return strategy.pay(amount, paymentData);
  }

  private getStrategyClass(method: PaymentMethod): any {
    const strategyMap = {
      [PaymentMethod.CREDIT_CARD]: CreditCardPaymentStrategy,
      [PaymentMethod.PAYPAL]: PaypalPaymentStrategy,
      [PaymentMethod.BANK_TRANSFER]: BankTransferPaymentStrategy,
    };

    const strategyClass = strategyMap[method];
    if (!strategyClass) {
      throw new Error(`No strategy found for payment method: ${method}`);
    }

    return strategyClass;
  }
}
```

---

## CQRS Pattern

### CQRS Overview (Q78)

CQRS (Command Query Responsibility Segregation) separates read and write operations, allowing optimization of each side independently.

**CQRS Benefits:**
- Separate optimization for reads and writes
- Different data models for queries and commands
- Better scalability
- Clear separation of concerns

### CQRS Implementation in NestJS (Q79)

**Installation:**
```bash
npm install @nestjs/cqrs
```

**Basic CQRS Setup:**
```typescript
// commands/create-user.command.ts
export class CreateUserCommand {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
  ) {}
}

// commands/handlers/create-user.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const { firstName, lastName, email } = command;
    
    const user = await this.userRepository.create({
      firstName,
      lastName,
      email,
    });

    return user.id;
  }
}

// queries/get-user.query.ts
export class GetUserQuery {
  constructor(public readonly userId: string) {}
}

// queries/handlers/get-user.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserQuery): Promise<UserDto> {
    const user = await this.userRepository.findById(query.userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserDto(user);
  }
}
```

**Events in CQRS:**
```typescript
// events/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

// events/handlers/user-created.handler.ts
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    const { userId, email } = event;
    
    await this.emailService.sendWelcomeEmail(email);
    console.log(`Welcome email sent to user ${userId}`);
  }
}

// Updated command handler with events
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const { firstName, lastName, email } = command;
    
    const user = await this.userRepository.create({
      firstName,
      lastName,
      email,
    });

    // Publish event
    this.eventBus.publish(new UserCreatedEvent(user.id, user.email));

    return user.id;
  }
}
```

**CQRS Controller:**
```typescript
// controllers/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<{ id: string }> {
    const command = new CreateUserCommand(
      createUserDto.firstName,
      createUserDto.lastName,
      createUserDto.email,
    );
    
    const id = await this.commandBus.execute(command);
    return { id };
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserDto> {
    const query = new GetUserQuery(id);
    return this.queryBus.execute(query);
  }
}
```

**Module Configuration:**
```typescript
// modules/users.module.ts
import { CqrsModule } from '@nestjs/cqrs';

const CommandHandlers = [CreateUserHandler, UpdateUserHandler];
const QueryHandlers = [GetUserHandler, GetUsersHandler];
const EventHandlers = [UserCreatedHandler, UserUpdatedHandler];

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    UserRepository,
  ],
})
export class UsersModule {}
```

### Commands vs Queries (Q81)

| Aspect | Commands | Queries |
|--------|----------|---------|
| **Purpose** | Modify state | Read state |
| **Return Value** | Success/failure indicators | Data |
| **Side Effects** | Yes | No |
| **Caching** | Not cacheable | Cacheable |
| **Performance** | Write-optimized | Read-optimized |

**Command Example:**
```typescript
// Commands modify state
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  async execute(command: UpdateUserCommand): Promise<void> {
    // Modifies database state
    await this.userRepository.update(command.userId, command.updates);
    
    // May trigger events
    this.eventBus.publish(new UserUpdatedEvent(command.userId));
  }
}
```

**Query Example:**
```typescript
// Queries only read state
@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  async execute(query: GetUsersQuery): Promise<UserDto[]> {
    // Only reads from database
    const users = await this.userRepository.findAll();
    
    // No side effects, pure read operation
    return users.map(user => new UserDto(user));
  }
}
```

---

## Event Sourcing

### Event Sourcing Overview (Q80)

Event Sourcing stores state changes as a sequence of events rather than storing current state directly.

**Event Sourcing Benefits:**
- Complete audit trail
- Ability to rebuild state at any point
- Support for temporal queries
- Natural fit with event-driven architectures

**Event Sourcing Implementation:**
```typescript
// events/domain-event.interface.ts
export interface DomainEvent {
  aggregateId: string;
  version: number;
  timestamp: Date;
  type: string;
}

// events/user-events.ts
export class UserRegisteredEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly version: number,
    public readonly timestamp: Date,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}

  get type(): string {
    return 'UserRegistered';
  }
}

export class UserEmailChangedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly version: number,
    public readonly timestamp: Date,
    public readonly oldEmail: string,
    public readonly newEmail: string,
  ) {}

  get type(): string {
    return 'UserEmailChanged';
  }
}
```

**Event Store:**
```typescript
// services/event-store.service.ts
@Injectable()
export class EventStore {
  constructor(private readonly eventRepository: EventRepository) {}

  async saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    // Optimistic concurrency check
    const currentVersion = await this.eventRepository.getCurrentVersion(aggregateId);
    
    if (currentVersion !== expectedVersion) {
      throw new ConflictException('Concurrency conflict');
    }

    await this.eventRepository.saveEvents(aggregateId, events);
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    return this.eventRepository.getEvents(aggregateId, fromVersion);
  }

  async getEventsFromTimestamp(aggregateId: string, timestamp: Date): Promise<DomainEvent[]> {
    return this.eventRepository.getEventsFromTimestamp(aggregateId, timestamp);
  }
}
```

**Aggregate Root with Event Sourcing:**
```typescript
// domain/user.aggregate.ts
export class UserAggregate {
  private id: string;
  private email: string;
  private firstName: string;
  private lastName: string;
  private version: number = 0;
  private uncommittedEvents: DomainEvent[] = [];

  static fromHistory(events: DomainEvent[]): UserAggregate {
    const aggregate = new UserAggregate();
    
    for (const event of events) {
      aggregate.applyEvent(event);
    }
    
    aggregate.uncommittedEvents = [];
    return aggregate;
  }

  register(id: string, email: string, firstName: string, lastName: string): void {
    const event = new UserRegisteredEvent(
      id,
      this.version + 1,
      new Date(),
      email,
      firstName,
      lastName,
    );
    
    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  changeEmail(newEmail: string): void {
    if (this.email === newEmail) {
      return; // No change needed
    }

    const event = new UserEmailChangedEvent(
      this.id,
      this.version + 1,
      new Date(),
      this.email,
      newEmail,
    );
    
    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: DomainEvent): void {
    switch (event.type) {
      case 'UserRegistered':
        this.applyUserRegistered(event as UserRegisteredEvent);
        break;
      case 'UserEmailChanged':
        this.applyUserEmailChanged(event as UserEmailChangedEvent);
        break;
    }
    
    this.version = event.version;
  }

  private applyUserRegistered(event: UserRegisteredEvent): void {
    this.id = event.aggregateId;
    this.email = event.email;
    this.firstName = event.firstName;
    this.lastName = event.lastName;
  }

  private applyUserEmailChanged(event: UserEmailChangedEvent): void {
    this.email = event.newEmail;
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.uncommittedEvents;
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }
}
```

### Sagas in CQRS (Q82)

Sagas coordinate multiple aggregates and handle long-running processes.

**Saga Implementation:**
```typescript
// sagas/user-registration.saga.ts
import { Injectable } from '@nestjs/common';
import { Saga, ICommand, ofType } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';

@Injectable()
export class UserRegistrationSaga {
  @Saga()
  userRegistered = (events$: Observable<any>): Observable<ICommand> => {
    return events$
      .pipe(
        ofType(UserRegisteredEvent),
        delay(1000), // Wait 1 second
        map(event => new SendWelcomeEmailCommand(event.aggregateId, event.email)),
      );
  };

  @Saga()
  welcomeEmailSent = (events$: Observable<any>): Observable<ICommand> => {
    return events$
      .pipe(
        ofType(WelcomeEmailSentEvent),
        map(event => new CreateUserProfileCommand(event.userId)),
      );
  };
}

// sagas/order-processing.saga.ts
@Injectable()
export class OrderProcessingSaga {
  @Saga()
  orderPlaced = (events$: Observable<any>): Observable<ICommand> => {
    return events$
      .pipe(
        ofType(OrderPlacedEvent),
        map(event => new ReserveInventoryCommand(event.orderId, event.items)),
      );
  };

  @Saga()
  inventoryReserved = (events$: Observable<any>): Observable<ICommand> => {
    return events$
      .pipe(
        ofType(InventoryReservedEvent),
        map(event => new ProcessPaymentCommand(event.orderId, event.amount)),
      );
  };

  @Saga()
  paymentProcessed = (events$: Observable<any>): Observable<ICommand> => {
    return events$
      .pipe(
        ofType(PaymentProcessedEvent),
        map(event => new FulfillOrderCommand(event.orderId)),
      );
  };

  @Saga()
  paymentFailed = (events$: Observable<any>): Observable<ICommand> => {
    return events$
      .pipe(
        ofType(PaymentFailedEvent),
        map(event => new ReleaseInventoryCommand(event.orderId)),
      );
  };
}
```

---

## Domain-Driven Design (DDD)

### DDD Implementation in NestJS (Q83)

Domain-Driven Design structures code around business domain concepts.

**Domain Structure:**
```
src/
├── domain/
│   ├── user/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── aggregates/
│   │   └── repositories/
│   └── order/
│       ├── entities/
│       ├── value-objects/
│       ├── aggregates/
│       └── repositories/
├── application/
│   ├── commands/
│   ├── queries/
│   └── services/
└── infrastructure/
    ├── database/
    └── external/
```

### Aggregates in DDD (Q84)

Aggregates are clusters of domain objects that can be treated as a single unit.

**Order Aggregate Example:**
```typescript
// domain/order/aggregates/order.aggregate.ts
import { AggregateRoot } from '@nestjs/cqrs';

export class OrderAggregate extends AggregateRoot {
  private constructor(
    private readonly id: OrderId,
    private readonly customerId: CustomerId,
    private items: OrderItem[],
    private status: OrderStatus,
    private totalAmount: Money,
    private createdAt: Date,
  ) {
    super();
  }

  static create(customerId: CustomerId, items: OrderItemData[]): OrderAggregate {
    const orderId = OrderId.generate();
    const orderItems = items.map(item => OrderItem.create(item));
    const totalAmount = OrderAggregate.calculateTotal(orderItems);
    
    const order = new OrderAggregate(
      orderId,
      customerId,
      orderItems,
      OrderStatus.PENDING,
      totalAmount,
      new Date(),
    );

    order.apply(new OrderCreatedEvent(orderId.value, customerId.value, totalAmount.value));
    return order;
  }

  static fromSnapshot(snapshot: OrderSnapshot): OrderAggregate {
    return new OrderAggregate(
      new OrderId(snapshot.id),
      new CustomerId(snapshot.customerId),
      snapshot.items.map(item => OrderItem.fromSnapshot(item)),
      new OrderStatus(snapshot.status),
      new Money(snapshot.totalAmount),
      snapshot.createdAt,
    );
  }

  addItem(productId: ProductId, quantity: Quantity, price: Money): void {
    if (this.status.value !== 'PENDING') {
      throw new DomainException('Cannot add items to non-pending order');
    }

    const existingItem = this.items.find(item => item.productId.equals(productId));
    
    if (existingItem) {
      existingItem.updateQuantity(existingItem.quantity.add(quantity));
    } else {
      const newItem = OrderItem.create({
        productId: productId.value,
        quantity: quantity.value,
        price: price.value,
      });
      this.items.push(newItem);
    }

    this.recalculateTotal();
    this.apply(new OrderItemAddedEvent(this.id.value, productId.value, quantity.value));
  }

  confirm(): void {
    if (this.status.value !== 'PENDING') {
      throw new DomainException('Order is already confirmed or cancelled');
    }

    if (this.items.length === 0) {
      throw new DomainException('Cannot confirm order without items');
    }

    this.status = OrderStatus.CONFIRMED;
    this.apply(new OrderConfirmedEvent(this.id.value, this.totalAmount.value));
  }

  cancel(reason: string): void {
    if (this.status.value === 'DELIVERED') {
      throw new DomainException('Cannot cancel delivered order');
    }

    this.status = OrderStatus.CANCELLED;
    this.apply(new OrderCancelledEvent(this.id.value, reason));
  }

  private static calculateTotal(items: OrderItem[]): Money {
    const total = items.reduce((sum, item) => {
      return sum + (item.price.value * item.quantity.value);
    }, 0);
    return new Money(total);
  }

  private recalculateTotal(): void {
    this.totalAmount = OrderAggregate.calculateTotal(this.items);
  }

  // Getters
  getId(): OrderId { return this.id; }
  getCustomerId(): CustomerId { return this.customerId; }
  getItems(): OrderItem[] { return [...this.items]; }
  getStatus(): OrderStatus { return this.status; }
  getTotalAmount(): Money { return this.totalAmount; }
  getCreatedAt(): Date { return this.createdAt; }
}
```

### Value Objects in DDD (Q85)

Value Objects represent descriptive aspects of the domain with no conceptual identity.

**Value Object Examples:**
```typescript
// domain/shared/value-objects/money.vo.ts
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'USD') {
    if (amount < 0) {
      throw new DomainException('Money amount cannot be negative');
    }
    
    this.amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    this.currency = currency.toUpperCase();
  }

  get value(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(multiplier: number): Money {
    return new Money(this.amount * multiplier, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainException(
        `Cannot perform operation on different currencies: ${this.currency} and ${other.currency}`
      );
    }
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }
}

// domain/user/value-objects/email.vo.ts
export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!this.isValidEmail(email)) {
      throw new DomainException('Invalid email format');
    }
    
    this.value = email.toLowerCase().trim();
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString(): string {
    return this.value;
  }
}

// domain/shared/value-objects/address.vo.ts
export class Address {
  constructor(
    private readonly street: string,
    private readonly city: string,
    private readonly state: string,
    private readonly zipCode: string,
    private readonly country: string,
  ) {
    if (!street?.trim()) throw new DomainException('Street is required');
    if (!city?.trim()) throw new DomainException('City is required');
    if (!state?.trim()) throw new DomainException('State is required');
    if (!zipCode?.trim()) throw new DomainException('Zip code is required');
    if (!country?.trim()) throw new DomainException('Country is required');
  }

  getStreet(): string { return this.street; }
  getCity(): string { return this.city; }
  getState(): string { return this.state; }
  getZipCode(): string { return this.zipCode; }
  getCountry(): string { return this.country; }

  equals(other: Address): boolean {
    return this.street === other.street &&
           this.city === other.city &&
           this.state === other.state &&
           this.zipCode === other.zipCode &&
           this.country === other.country;
  }

  toString(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }
}
```

**Entity with Value Objects:**
```typescript
// domain/user/entities/user.entity.ts
export class User {
  constructor(
    private readonly id: UserId,
    private email: Email,
    private name: PersonName,
    private address: Address,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  changeEmail(newEmail: Email): void {
    if (this.email.equals(newEmail)) {
      return; // No change needed
    }
    
    this.email = newEmail;
    this.updatedAt = new Date();
  }

  updateAddress(newAddress: Address): void {
    if (this.address.equals(newAddress)) {
      return; // No change needed
    }
    
    this.address = newAddress;
    this.updatedAt = new Date();
  }

  // Getters
  getId(): UserId { return this.id; }
  getEmail(): Email { return this.email; }
  getName(): PersonName { return this.name; }
  getAddress(): Address { return this.address; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
```

---

## Advanced Architectural Patterns

### Hexagonal Architecture Implementation
```typescript
// ports/user.port.ts (Interface for the domain)
export interface UserPort {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}

// adapters/user.adapter.ts (Infrastructure implementation)
@Injectable()
export class UserAdapter implements UserPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async save(user: User): Promise<void> {
    const userEntity = this.toEntity(user);
    await this.userRepository.save(userEntity);
  }

  private toDomain(entity: UserEntity): User {
    return new User(
      new UserId(entity.id),
      new Email(entity.email),
      new PersonName(entity.firstName, entity.lastName),
      new Address(entity.street, entity.city, entity.state, entity.zipCode, entity.country),
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.getId().value;
    entity.email = user.getEmail().getValue();
    entity.firstName = user.getName().getFirstName();
    entity.lastName = user.getName().getLastName();
    // ... map other fields
    return entity;
  }
}
```

---

## Best Practices

### 1. Module Design
```typescript
// ✅ Good - Well-structured dynamic module
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerOptions): DynamicModule {
    return {
      module: LoggerModule,
      global: options.isGlobal,
      providers: [
        {
          provide: 'LOGGER_OPTIONS',
          useValue: options,
        },
        LoggerService,
      ],
      exports: [LoggerService],
    };
  }
}

// ❌ Bad - Tightly coupled module
@Module({
  providers: [
    { provide: 'CONFIG', useValue: { env: 'production' } }, // Hardcoded
  ],
})
export class BadModule {}
```

### 2. CQRS Organization
```typescript
// ✅ Good - Clear separation
export class CreateUserCommand {
  constructor(public readonly userData: CreateUserData) {}
}

export class GetUserQuery {
  constructor(public readonly userId: string) {}
}

// ❌ Bad - Mixed responsibilities
export class UserAction {
  constructor(public readonly action: string, public readonly data: any) {}
}
```

### 3. Value Object Design
```typescript
// ✅ Good - Immutable value object
export class Money {
  constructor(private readonly amount: number) {
    if (amount < 0) throw new Error('Amount cannot be negative');
  }
  
  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }
}

// ❌ Bad - Mutable value object
export class BadMoney {
  constructor(public amount: number) {}
  
  add(other: BadMoney): void {
    this.amount += other.amount; // Mutates state
  }
}
```

---

## Study Plan

### Week 1: Dynamic Modules & Patterns
- **Days 1-2**: Dynamic modules and registration methods
- **Days 3-4**: Custom decorators and their applications
- **Days 5-7**: Repository and Factory patterns implementation

### Week 2: CQRS Fundamentals
- **Days 1-3**: CQRS concepts, commands, and queries
- **Days 4-5**: Event handling and saga patterns
- **Days 6-7**: Event sourcing basics

### Week 3: Domain-Driven Design
- **Days 1-3**: DDD concepts, aggregates, and entities
- **Days 4-5**: Value objects and domain services
- **Days 6-7**: Advanced DDD patterns

### Week 4: Advanced Architecture
- **Days 1-2**: Hexagonal architecture implementation
- **Days 3-4**: Integration patterns and best practices
- **Days 5-7**: Real-world application design

### Hands-On Projects:
1. **E-commerce Platform** - Complete CQRS with event sourcing
2. **User Management System** - DDD implementation with aggregates
3. **Payment Processing** - Strategy pattern with multiple providers
4. **Configuration Service** - Dynamic modules with async configuration

This comprehensive guide covers all aspects of NestJS architecture and design patterns, providing you with the knowledge needed to answer questions 71-85 confidently in technical interviews.