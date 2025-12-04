# NestJS Basic Operations Knowledge Summary (Q16-30)

## Table of Contents
1. [HTTP Request Handling](#http-request-handling)
2. [Parameter Access & Decorators](#parameter-access--decorators)
3. [Response Handling](#response-handling)
4. [File Upload Handling](#file-upload-handling)
5. [Exception Handling](#exception-handling)
6. [Practical Examples](#practical-examples)
7. [Best Practices](#best-practices)
8. [Study Plan](#study-plan)

---

## HTTP Request Handling

### GET Requests (Q16)

GET requests are handled using the `@Get()` decorator in NestJS controllers.

**Basic GET Request:**
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  // GET /users
  @Get()
  findAll(): string {
    return 'This action returns all users';
  }

  // GET /users/profile
  @Get('profile')
  getProfile(): string {
    return 'User profile';
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id') id: string): string {
    return `This action returns user #${id}`;
  }
}
```

**Advanced GET with Query Parameters:**
```typescript
@Controller('products')
export class ProductsController {
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string
  ) {
    return {
      page,
      limit,
      category,
      message: 'Products retrieved successfully'
    };
  }
}
```

### POST Requests (Q17)

POST requests are handled using the `@Post()` decorator and typically involve request body processing.

**Basic POST Request:**
```typescript
import { Controller, Post, Body } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() createUserDto: any): string {
    return 'This action adds a new user';
  }

  @Post('login')
  login(@Body() loginDto: { email: string; password: string }) {
    return {
      message: 'Login successful',
      user: loginDto.email
    };
  }
}
```

**POST with DTO Validation:**
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return {
      message: 'User created successfully',
      user: createUserDto
    };
  }
}
```

---

## Parameter Access & Decorators

### Route Parameters - @Param() Decorator (Q18, Q22)

The `@Param()` decorator extracts route parameters from the URL path.

**Single Parameter:**
```typescript
@Controller('users')
export class UsersController {
  // GET /users/123
  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id, message: `User ${id} found` };
  }

  // GET /users/123/posts/456
  @Get(':userId/posts/:postId')
  getUserPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string
  ) {
    return { userId, postId };
  }
}
```

**All Parameters:**
```typescript
@Controller('users')
export class UsersController {
  @Get(':id/posts/:postId')
  getUserPost(@Param() params: any) {
    return {
      userId: params.id,
      postId: params.postId
    };
  }
}
```

**Parameter Validation:**
```typescript
import { ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return { id }; // id is now a number
  }

  @Get('uuid/:id')
  findByUUID(@Param('id', ParseUUIDPipe) id: string) {
    return { id }; // id is validated as UUID
  }
}
```

### Query Parameters - @Query() Decorator (Q19, Q23)

The `@Query()` decorator extracts query string parameters from the URL.

**Single Query Parameter:**
```typescript
@Controller('products')
export class ProductsController {
  // GET /products?category=electronics
  @Get()
  findByCategory(@Query('category') category: string) {
    return { category, products: [] };
  }

  // GET /products?page=2&limit=20
  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      products: []
    };
  }
}
```

**All Query Parameters:**
```typescript
@Controller('search')
export class SearchController {
  @Get()
  search(@Query() query: any) {
    return {
      searchParams: query,
      results: []
    };
  }
}
```

**Query Parameter Validation:**
```typescript
import { Transform } from 'class-transformer';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

@Controller('products')
export class ProductsController {
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return {
      page: paginationDto.page,
      limit: paginationDto.limit,
      products: []
    };
  }
}
```

### Request Body - @Body() Decorator (Q20, Q21)

The `@Body()` decorator extracts data from the request body.

**Basic Body Access:**
```typescript
@Controller('posts')
export class PostsController {
  @Post()
  create(@Body() post: any) {
    return { message: 'Post created', post };
  }

  @Post('with-title')
  createWithTitle(@Body('title') title: string) {
    return { title, message: 'Post created with title' };
  }
}
```

**DTO with Validation:**
```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  category?: string;
}

@Controller('posts')
export class PostsController {
  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return {
      message: 'Post created successfully',
      post: createPostDto
    };
  }
}
```

### Request Object - @Req() Decorator (Q29)

The `@Req()` decorator provides access to the entire request object.

```typescript
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('info')
export class InfoController {
  @Get()
  getRequestInfo(@Req() request: Request) {
    return {
      method: request.method,
      url: request.url,
      headers: request.headers,
      userAgent: request.get('user-agent'),
      ip: request.ip
    };
  }

  @Get('custom')
  customHandler(@Req() req: Request) {
    return {
      timestamp: new Date().toISOString(),
      protocol: req.protocol,
      hostname: req.hostname,
      originalUrl: req.originalUrl
    };
  }
}
```

---

## Response Handling

### HTTP Status Codes (Q24, Q25)

Control response status codes using `@HttpCode()` decorator or response object.

**Using @HttpCode() Decorator:**
```typescript
import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(HttpStatus.OK) // 200 instead of default 201
  login(@Body() loginDto: any) {
    return { message: 'Login successful' };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED) // 201 (default for POST)
  register(@Body() registerDto: any) {
    return { message: 'User registered' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT) // 204
  logout() {
    // No return needed for 204
  }
}
```

**Dynamic Status Codes:**
```typescript
import { Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() createUserDto: any, @Res() res: Response) {
    if (/* some condition */) {
      return res.status(HttpStatus.CONFLICT).json({
        message: 'User already exists'
      });
    }
    
    return res.status(HttpStatus.CREATED).json({
      message: 'User created successfully',
      user: createUserDto
    });
  }
}
```

### Response Object - @Res() vs @Response() (Q27)

Both `@Res()` and `@Response()` are aliases for the same decorator.

```typescript
import { Controller, Get, Res, Response } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';

@Controller('download')
export class DownloadController {
  @Get('file')
  downloadFile(@Res() res: ExpressResponse) {
    res.download('./files/sample.pdf');
  }

  @Get('redirect')
  redirect(@Response() res: ExpressResponse) {
    res.redirect('https://example.com');
  }

  // Standard approach (recommended)
  @Get('json')
  getJson() {
    return { message: 'This is JSON response' };
  }
}
```

### Custom Headers (Q28)

Set custom headers in responses using the response object or decorators.

**Using Response Object:**
```typescript
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('api')
export class ApiController {
  @Get('data')
  getData(@Res() res: Response) {
    res.header('X-Custom-Header', 'MyValue');
    res.header('Cache-Control', 'no-cache');
    
    return res.json({
      data: 'Some data',
      timestamp: new Date().toISOString()
    });
  }
}
```

**Using @Header() Decorator:**
```typescript
import { Controller, Get, Header } from '@nestjs/common';

@Controller('api')
export class ApiController {
  @Get('data')
  @Header('Cache-Control', 'none')
  @Header('X-API-Version', '1.0')
  getData() {
    return {
      data: 'Some data',
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## File Upload Handling

### File Uploads (Q26)

Handle file uploads using Multer with NestJS decorators.

**Single File Upload:**
```typescript
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  }
}
```

**Multiple Files Upload:**
```typescript
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return {
      message: `${files.length} files uploaded successfully`,
      files: files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      }))
    };
  }
}
```

**Custom Storage Configuration:**
```typescript
import { diskStorage } from 'multer';

@Controller('upload')
export class UploadController {
  @Post('custom')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 1024 * 1024 * 5, // 5MB limit
    },
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'Image uploaded successfully',
      path: file.path,
      size: file.size
    };
  }
}
```

---

## Exception Handling

### Exception Handling (Q30)

NestJS provides built-in exception handling mechanisms.

**Built-in HTTP Exceptions:**
```typescript
import { 
  Controller, 
  Get, 
  Param, 
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException
} from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!id || isNaN(+id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = this.findUserById(+id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    // Check authentication
    if (!this.isAuthenticated()) {
      throw new UnauthorizedException('You must be logged in');
    }

    // Check authorization
    if (!this.hasAccess(id)) {
      throw new ForbiddenException('Access denied to this profile');
    }

    return this.getUserProfile(id);
  }

  private findUserById(id: number) {
    // Mock implementation
    return id === 1 ? { id, name: 'John' } : null;
  }

  private isAuthenticated(): boolean {
    // Mock implementation
    return true;
  }

  private hasAccess(userId: string): boolean {
    // Mock implementation
    return true;
  }

  private getUserProfile(id: string) {
    return { id, profile: 'User profile data' };
  }
}
```

**Custom Exception Filter:**
```typescript
import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exception.message,
        error: exception.name
      });
  }
}
```

**Using Exception Filter:**
```typescript
import { UseFilters } from '@nestjs/common';

@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UsersController {
  // Controller methods here
}

// Or globally in main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
```

**Custom Exception:**
```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomBusinessException extends HttpException {
  constructor(message: string, code?: string) {
    super(
      {
        message,
        error: 'Business Logic Error',
        code,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

@Controller('business')
export class BusinessController {
  @Post('process')
  processData(@Body() data: any) {
    if (!this.validateBusinessRules(data)) {
      throw new CustomBusinessException(
        'Business validation failed',
        'INVALID_BUSINESS_DATA'
      );
    }
    return { message: 'Data processed successfully' };
  }

  private validateBusinessRules(data: any): boolean {
    // Mock validation
    return data.amount > 0;
  }
}
```

---

## Practical Examples

### Complete CRUD Controller Example

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseIntPipe,
  ValidationPipe,
  UseFilters,
  Header
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

export class CreateUserDto {
  name: string;
  email: string;
  age: number;
}

export class UpdateUserDto {
  name?: string;
  email?: string;
  age?: number;
}

export class PaginationQuery {
  page: number = 1;
  limit: number = 10;
}

@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UsersController {
  private users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  ];

  // GET /users?page=1&limit=10
  @Get()
  @Header('X-Total-Count', '2')
  findAll(@Query() query: PaginationQuery) {
    const { page, limit } = query;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: this.users.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total: this.users.length,
        totalPages: Math.ceil(this.users.length / limit)
      }
    };
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const user = this.users.find(user => user.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // POST /users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    const newUser = {
      id: this.users.length + 1,
      ...createUserDto
    };
    this.users.push(newUser);
    
    return {
      message: 'User created successfully',
      user: newUser
    };
  }

  // PUT /users/:id
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto
  ) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updateUserDto };
    
    return {
      message: 'User updated successfully',
      user: this.users[userIndex]
    };
  }

  // DELETE /users/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.users.splice(userIndex, 1);
  }
}
```

### File Upload with Validation Example

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    };
  }
}
```

---

## Best Practices

### 1. Use DTOs for Type Safety
```typescript
// ✅ Good - Use DTOs with validation
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}

// ❌ Bad - Using any type
@Post()
create(@Body() data: any) {
  // ...
}
```

### 2. Proper Error Handling
```typescript
// ✅ Good - Specific exceptions
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  const user = this.userService.findById(id);
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}

// ❌ Bad - Generic errors
@Get(':id')
findOne(@Param('id') id: string) {
  try {
    return this.userService.findById(id);
  } catch (error) {
    throw new Error('Something went wrong');
  }
}
```

### 3. Use Proper HTTP Status Codes
```typescript
// ✅ Good - Appropriate status codes
@Post()
@HttpCode(HttpStatus.CREATED)
create(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}

@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
remove(@Param('id') id: number) {
  this.userService.remove(id);
}
```

### 4. Parameter Validation
```typescript
// ✅ Good - Use pipes for validation
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.userService.findById(id);
}

// ❌ Bad - No validation
@Get(':id')
findOne(@Param('id') id: string) {
  return this.userService.findById(parseInt(id));
}
```

---

## Study Plan

### Day 1-2: HTTP Request Handling
- Study GET and POST request handling
- Practice with different route patterns
- Learn about HTTP methods and their use cases

### Day 3-4: Parameter Access
- Master @Param(), @Query(), and @Body() decorators
- Practice parameter validation with pipes
- Learn about DTO creation and validation

### Day 5-6: Response Handling
- Study HTTP status codes and their usage
- Practice with @HttpCode() decorator
- Learn custom header setting techniques

### Day 7-8: File Operations
- Implement file upload functionality
- Study Multer integration
- Practice with file validation and storage

### Day 9-10: Exception Handling
- Study built-in exceptions
- Create custom exception filters
- Practice proper error handling patterns

### Practice Projects:
1. **User Management API** - Complete CRUD with validation
2. **File Upload Service** - Multiple file types with validation
3. **Blog API** - Complex queries with pagination and filtering

### Key Concepts to Remember:
- NestJS decorators are the primary way to handle requests
- Always validate input data using DTOs and pipes
- Use appropriate HTTP status codes for different operations
- Implement proper exception handling for robust APIs
- File uploads require Multer configuration
- Request/response objects provide low-level access when needed

This knowledge summary covers all the essential concepts needed to answer questions 16-30 about NestJS basic operations. Focus on hands-on practice with each decorator and concept to build confidence in real-world scenarios.