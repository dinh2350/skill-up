# NestJS Configuration & Database Knowledge Summary (Q46-60)

## Table of Contents
1. [Configuration Management](#configuration-management)
2. [Environment Variables](#environment-variables)
3. [Database Connection](#database-connection)
4. [TypeORM Integration](#typeorm-integration)
5. [Mongoose Integration](#mongoose-integration)
6. [Prisma Integration](#prisma-integration)
7. [Database Operations](#database-operations)
8. [Advanced Patterns](#advanced-patterns)
9. [Best Practices](#best-practices)
10. [Study Plan](#study-plan)

---

## Configuration Management

### Configuration in NestJS (Q46)

Configuration management in NestJS involves organizing and accessing application settings, database credentials, API keys, and environment-specific values in a structured and secure way.

**Basic Configuration Approaches:**
1. Environment Variables (.env files)
2. JSON/YAML configuration files
3. External configuration services
4. Database-stored configuration

### @nestjs/config Module (Q47)

The `@nestjs/config` module provides a robust configuration management solution built on top of dotenv.

**Installation:**
```bash
npm install @nestjs/config
npm install --save-dev @types/node
```

**Basic Setup:**
```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // Makes ConfigService available globally
      envFilePath: '.env',   // Path to env file
      ignoreEnvFile: false,  // Set to true in production
    }),
  ],
})
export class AppModule {}
```

**Advanced Configuration:**
```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
});

// app.module.ts
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test'),
        PORT: Joi.number().default(3000),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().default(5432),
        DATABASE_USERNAME: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

### Environment Variables (Q48)

Environment variables provide a way to configure applications without hardcoding values.

**Using ConfigService:**
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getAppInfo(): any {
    return {
      port: this.configService.get<number>('PORT'),
      environment: this.configService.get<string>('NODE_ENV'),
      database: {
        host: this.configService.get<string>('database.host'),
        port: this.configService.get<number>('database.port'),
      },
      // With default value
      timeout: this.configService.get<number>('TIMEOUT', 5000),
    };
  }
}
```

**Environment-specific Configuration:**
```typescript
// .env.development
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp_dev
DEBUG=true
LOG_LEVEL=debug

// .env.production
NODE_ENV=production
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=5432
DATABASE_NAME=myapp_prod
DEBUG=false
LOG_LEVEL=error

// .env.test
NODE_ENV=test
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=myapp_test
DEBUG=false
LOG_LEVEL=silent
```

**Configuration Validation:**
```typescript
import * as Joi from 'joi';

const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
})
export class AppModule {}
```

---

## Database Connection

### Database Connection (Q49)

NestJS supports multiple databases through various ORM/ODM integrations.

**Common Database Integrations:**
- **TypeORM** - SQL databases (PostgreSQL, MySQL, SQLite, etc.)
- **Mongoose** - MongoDB
- **Prisma** - Modern database toolkit
- **Sequelize** - SQL databases with different syntax
- **MikroORM** - TypeScript ORM

---

## TypeORM Integration

### TypeORM with NestJS (Q50)

TypeORM is a powerful ORM that works well with TypeScript and supports multiple SQL databases.

**Installation:**
```bash
npm install @nestjs/typeorm typeorm pg
npm install --save-dev @types/pg
```

**Basic Setup:**
```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Defining Entities (Q53)

Entities represent database tables and are defined using decorators.

**Basic Entity:**
```typescript
// entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
```

**Complex Entity with Relationships:**
```typescript
// entities/post.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Tag } from './tag.entity';

@Entity('posts')
@Index(['title', 'createdAt'])
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ default: false })
  published: boolean;

  @Column({ nullable: true })
  publishedAt: Date;

  @ManyToOne(() => User, user => user.posts)
  author: User;

  @Column()
  authorId: number;

  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];

  @ManyToMany(() => Tag, tag => tag.posts)
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Database Migrations (Q54)

Migrations provide version control for database schema changes.

**Migration Configuration:**
```typescript
// ormconfig.ts
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
```

**Creating Migrations:**
```bash
# Generate migration
npx typeorm migration:generate src/migrations/CreateUserTable -d ormconfig.ts

# Run migrations
npx typeorm migration:run -d ormconfig.ts

# Revert migration
npx typeorm migration:revert -d ormconfig.ts
```

**Migration Example:**
```typescript
// migrations/1234567890123-CreateUserTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'firstName',
            type: 'varchar',
          },
          {
            name: 'lastName',
            type: 'varchar',
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### Database Relationships (Q58)

TypeORM supports various relationship types.

**One-to-Many / Many-to-One:**
```typescript
// entities/user.entity.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}

// entities/post.entity.ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User, user => user.posts)
  author: User;

  @Column()
  authorId: number;
}
```

**Many-to-Many:**
```typescript
// entities/post.entity.ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToMany(() => Tag, tag => tag.posts)
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];
}

// entities/tag.entity.ts
@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Post, post => post.tags)
  posts: Post[];
}
```

**One-to-One:**
```typescript
// entities/user.entity.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne(() => Profile, profile => profile.user, { cascade: true })
  @JoinColumn()
  profile: Profile;
}

// entities/profile.entity.ts
@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bio: string;

  @Column()
  avatar: string;

  @OneToOne(() => User, user => user.profile)
  user: User;
}
```

---

## Mongoose Integration

### Mongoose with NestJS (Q51)

Mongoose is an ODM for MongoDB that provides schema validation and modeling.

**Installation:**
```bash
npm install @nestjs/mongoose mongoose
npm install --save-dev @types/mongoose
```

**Basic Setup:**
```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

**Schema Definition:**
```typescript
// schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Post' }] })
  posts: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
```

**Service Implementation:**
```typescript
// users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: any): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().populate('posts').exec();
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<User> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
```

---

## Prisma Integration

### Prisma with NestJS (Q52)

Prisma is a modern database toolkit that provides type-safe database access.

**Installation:**
```bash
npm install prisma @prisma/client
npx prisma init
```

**Prisma Schema:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  password  String
  isActive  Boolean  @default(true) @map("is_active")
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Post {
  id          Int      @id @default(autoincrement())
  title       String
  content     String
  published   Boolean  @default(false)
  authorId    Int      @map("author_id")
  author      User     @relation(fields: [authorId], references: [id])
  tags        Tag[]    @relation("PostTags")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("posts")
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[] @relation("PostTags")

  @@map("tags")
}

enum Role {
  USER
  ADMIN
}
```

**Prisma Service:**
```typescript
// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService 
  extends PrismaClient 
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: { posts: true },
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { posts: true },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

---

## Database Operations

### Repository Pattern (Q55)

The repository pattern provides an abstraction layer over data access logic.

**TypeORM Repository Pattern:**
```typescript
// users.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['posts'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['posts'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.usersRepository.create(createUserDto);
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
```

### Database Transactions (Q56)

Transactions ensure data consistency by grouping multiple database operations.

**TypeORM Transactions:**
```typescript
// users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // Method 1: Using QueryRunner
  async createUserWithProfile(userData: any, profileData: any): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Create user
      const user = queryRunner.manager.create(User, userData);
      const savedUser = await queryRunner.manager.save(user);
      
      // Create profile
      const profile = queryRunner.manager.create(Profile, {
        ...profileData,
        userId: savedUser.id,
      });
      await queryRunner.manager.save(profile);
      
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Method 2: Using transaction decorator
  async transferPoints(fromUserId: number, toUserId: number, points: number): Promise<void> {
    await this.dataSource.transaction(async manager => {
      // Deduct points from sender
      await manager.decrement(User, { id: fromUserId }, 'points', points);
      
      // Add points to receiver
      await manager.increment(User, { id: toUserId }, 'points', points);
      
      // Log transaction
      const transaction = manager.create(Transaction, {
        fromUserId,
        toUserId,
        points,
        type: 'TRANSFER',
      });
      await manager.save(transaction);
    });
  }

  // Method 3: Using @Transaction decorator
  @Transaction()
  async createOrderWithItems(
    orderData: any,
    items: any[],
    @TransactionManager() manager: EntityManager,
  ): Promise<Order> {
    // Create order
    const order = manager.create(Order, orderData);
    const savedOrder = await manager.save(order);

    // Create order items
    for (const itemData of items) {
      const item = manager.create(OrderItem, {
        ...itemData,
        orderId: savedOrder.id,
      });
      await manager.save(item);
    }

    return savedOrder;
  }
}
```

**Prisma Transactions:**
```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Interactive transactions
  async transferPoints(fromUserId: number, toUserId: number, points: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Deduct points from sender
      const sender = await tx.user.update({
        where: { id: fromUserId },
        data: { points: { decrement: points } },
      });

      if (sender.points < 0) {
        throw new Error('Insufficient points');
      }

      // Add points to receiver
      await tx.user.update({
        where: { id: toUserId },
        data: { points: { increment: points } },
      });

      // Log transaction
      await tx.transaction.create({
        data: {
          fromUserId,
          toUserId,
          points,
          type: 'TRANSFER',
        },
      });
    });
  }

  // Batch transactions
  async createUsersInBatch(usersData: any[]): Promise<void> {
    const operations = usersData.map(userData =>
      this.prisma.user.create({ data: userData })
    );

    await this.prisma.$transaction(operations);
  }
}
```

### TypeORM vs Mongoose (Q57)

| Aspect | @nestjs/typeorm | @nestjs/mongoose |
|--------|----------------|------------------|
| **Database Type** | SQL databases | MongoDB only |
| **Type Safety** | Full TypeScript support | Partial (requires schemas) |
| **Query Language** | SQL-like (Query Builder) | MongoDB queries |
| **Relationships** | Strong support for JOINs | Manual population |
| **Schema** | Entity classes with decorators | Mongoose schemas |
| **Migrations** | Built-in migration system | Manual or external tools |
| **Performance** | Optimized SQL queries | Depends on MongoDB queries |
| **Learning Curve** | SQL knowledge required | MongoDB knowledge required |

### Database Seeders (Q59)

Seeders populate the database with initial or test data.

**TypeORM Seeder:**
```typescript
// seeds/user.seeder.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const existingUsers = await this.userRepository.count();
    if (existingUsers > 0) {
      console.log('Users already seeded');
      return;
    }

    const users = [
      {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
      },
      {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
      },
    ];

    await this.userRepository.save(users);
    console.log('Users seeded successfully');
  }
}

// seeds/database.seeder.ts
@Injectable()
export class DatabaseSeeder {
  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly postSeeder: PostSeeder,
  ) {}

  async seed(): Promise<void> {
    await this.userSeeder.seed();
    await this.postSeeder.seed();
  }
}

// Command to run seeders
// nestjs-command or custom script
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseSeeder } from './seeds/database.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(DatabaseSeeder);
  
  try {
    await seeder.seed();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
```

### Pagination Implementation (Q60)

Pagination efficiently handles large datasets by returning data in chunks.

**Offset-based Pagination:**
```typescript
// dto/pagination.dto.ts
import { IsOptional, IsPositive, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

// interfaces/paginated-result.interface.ts
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllPaginated(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
    const { page, limit, skip } = paginationDto;

    const [data, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}

// users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAllPaginated(paginationDto);
  }
}
```

**Cursor-based Pagination:**
```typescript
// dto/cursor-pagination.dto.ts
export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}

// users.service.ts
async findWithCursor(cursorDto: CursorPaginationDto): Promise<any> {
  const { cursor, limit, order } = cursorDto;
  const queryBuilder = this.userRepository.createQueryBuilder('user');

  if (cursor) {
    const operator = order === 'desc' ? '<' : '>';
    queryBuilder.where(`user.createdAt ${operator} :cursor`, {
      cursor: new Date(cursor),
    });
  }

  const users = await queryBuilder
    .orderBy('user.createdAt', order.toUpperCase() as 'ASC' | 'DESC')
    .limit(limit + 1)
    .getMany();

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, -1) : users;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  return {
    data,
    nextCursor,
    hasMore,
  };
}
```

**Prisma Pagination:**
```typescript
// users.service.ts
async findAllPaginated(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
  const { page, limit, skip } = paginationDto;

  const [data, total] = await Promise.all([
    this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { posts: true },
    }),
    this.prisma.user.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
```

---

## Advanced Patterns

### Configuration Namespaces
```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME,
  ssl: process.env.NODE_ENV === 'production',
  logging: process.env.NODE_ENV === 'development',
  synchronize: process.env.NODE_ENV === 'development',
}));

// Using in service
@Injectable()
export class DatabaseConfigService {
  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {}

  get connectionOptions() {
    return this.dbConfig;
  }
}
```

### Custom Repository
```typescript
// repositories/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findById(id: number): Promise<T | null> {
    return this.repository.findOne({ where: { id } as any });
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async create(entity: Partial<T>): Promise<T> {
    return this.repository.save(entity as any);
  }

  async update(id: number, updates: Partial<T>): Promise<T> {
    await this.repository.update(id, updates as any);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}

// repositories/users.repository.ts
@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }
}
```

---

## Best Practices

### 1. Configuration Security
```typescript
// ✅ Good - Use validation and type safety
const configValidationSchema = Joi.object({
  DATABASE_PASSWORD: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
});

// ✅ Good - Environment-specific configs
ConfigModule.forRoot({
  envFilePath: ['.env.local', '.env'],
  ignoreEnvFile: process.env.NODE_ENV === 'production',
});

// ❌ Bad - Hardcoded secrets
const jwtSecret = 'hardcoded-secret';
```

### 2. Database Connection Management
```typescript
// ✅ Good - Proper connection configuration
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // ... other config
    extra: {
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
    },
  }),
});

// ✅ Good - Health checks
@Injectable()
export class DatabaseHealthIndicator extends TypeOrmHealthIndicator {
  constructor(
    private readonly typeOrm: TypeOrmHealthIndicator,
    private readonly db: Connection,
  ) {
    super(typeOrm);
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    return this.typeOrm.pingCheck(key, { connection: this.db });
  }
}
```

### 3. Entity Design
```typescript
// ✅ Good - Use proper indexes and constraints
@Entity('users')
@Index(['email', 'isActive'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  // Soft delete
  @DeleteDateColumn()
  deletedAt?: Date;
}

// ❌ Bad - Missing constraints and indexes
@Entity()
export class User {
  @Column()
  email: string; // No unique constraint, no length limit
}
```

---

## Study Plan

### Week 1: Configuration Fundamentals
- **Days 1-2**: @nestjs/config module and environment variables
- **Days 3-4**: Configuration validation and namespaces
- **Days 5-7**: Environment-specific configurations and security

### Week 2: TypeORM Deep Dive
- **Days 1-2**: Entity definition and relationships
- **Days 3-4**: Migrations and advanced queries
- **Days 5-7**: Transactions and repository patterns

### Week 3: Alternative ORMs
- **Days 1-3**: Mongoose and MongoDB integration
- **Days 4-7**: Prisma setup and advanced features

### Week 4: Advanced Operations
- **Days 1-2**: Database seeders and testing
- **Days 3-4**: Pagination strategies
- **Days 5-7**: Performance optimization and best practices

### Hands-On Projects:
1. **Blog API** - Complete CRUD with TypeORM
2. **E-commerce System** - Complex relationships and transactions
3. **MongoDB Chat App** - Real-time with Mongoose
4. **Multi-tenant SaaS** - Advanced database patterns

This comprehensive guide covers all aspects of configuration and database management in NestJS, providing you with the knowledge needed to answer questions 46-60 confidently in technical interviews.