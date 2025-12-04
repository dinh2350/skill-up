# NestJS Validation & Transformation Knowledge Summary (Q61-70)

## Table of Contents
1. [Class-Validator](#class-validator)
2. [Class-Transformer](#class-transformer)
3. [Nested Object Validation](#nested-object-validation)
4. [Custom Validation Decorators](#custom-validation-decorators)
5. [Validation vs Transformation](#validation-vs-transformation)
6. [Optional Fields Handling](#optional-fields-handling)
7. [Conditional Validation](#conditional-validation)
8. [Array Validation](#array-validation)
9. [Advanced Patterns](#advanced-patterns)
10. [Best Practices](#best-practices)
11. [Study Plan](#study-plan)

---

## Class-Validator

### What is class-validator? (Q61)

`class-validator` is a library that uses decorators to validate objects based on their class definitions. It provides a declarative way to validate data using TypeScript decorators.

**Installation:**
```bash
npm install class-validator class-transformer
npm install --save-dev @types/validator
```

**Basic Usage:**
```typescript
import { IsString, IsEmail, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(18)
  @Max(120)
  age: number;
}
```

**Common Validation Decorators:**

#### String Validators
```typescript
export class StringValidationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsUrl()
  website: string;

  @IsUUID()
  id: string;

  @IsAlpha()
  alphabeticOnly: string;

  @IsAlphanumeric()
  alphanumericOnly: string;

  @Length(5, 20)
  username: string;

  @MinLength(8)
  password: string;

  @MaxLength(100)
  description: string;

  @Matches(/^[A-Za-z0-9]+$/)
  customPattern: string;

  @Contains('hello')
  mustContainHello: string;
}
```

#### Number Validators
```typescript
export class NumberValidationDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsInt()
  @IsPositive()
  positiveInteger: number;

  @IsNegative()
  negativeNumber: number;

  @IsDivisibleBy(5)
  divisibleBy5: number;

  @IsDecimal({ decimal_digits: '1,2' })
  decimalNumber: number;
}
```

#### Date and Boolean Validators
```typescript
export class DateBooleanValidationDto {
  @IsBoolean()
  isActive: boolean;

  @IsDate()
  birthDate: Date;

  @IsISO8601()
  isoDateString: string;

  @IsDateString()
  dateString: string;
}
```

#### Array and Object Validators
```typescript
export class ArrayObjectValidationDto {
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  scores: number[];

  @IsObject()
  metadata: object;

  @IsJSON()
  jsonData: string;
}
```

### ValidationPipe Integration

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // Strip non-whitelisted properties
    forbidNonWhitelisted: true,   // Throw error for non-whitelisted properties
    transform: true,              // Transform payloads to DTO instances
    disableErrorMessages: false,  // Show detailed error messages
    skipMissingProperties: false, // Validate missing properties
    skipNullProperties: false,    // Validate null properties
    skipUndefinedProperties: false, // Validate undefined properties
    stopAtFirstError: false,      // Continue validation after first error
    dismissDefaultMessages: false, // Use default error messages
    validationError: {
      target: false,              // Don't include target in error
      value: false,               // Don't include value in error
    },
  }));
  
  await app.listen(3000);
}
bootstrap();
```

---

## Class-Transformer

### What is class-transformer? (Q62)

`class-transformer` is a library that transforms plain JavaScript objects to class instances and vice versa. It works seamlessly with class-validator to provide data transformation capabilities.

**Basic Transformation:**
```typescript
import { Transform, Type, Exclude, Expose, plainToClass, classToPlain } from 'class-transformer';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  @Transform(({ value }) => value.toUpperCase())
  role: string;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// Usage
const plainUser = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'secret',
  role: 'admin'
};

const userInstance = plainToClass(UserDto, plainUser);
const plainObject = classToPlain(userInstance);
```

**Advanced Transformations:**

#### Date Transformations
```typescript
export class EventDto {
  @IsString()
  name: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate: Date;

  @Transform(({ value }) => value ? new Date(value) : null)
  @IsOptional()
  @IsDate()
  publishedAt?: Date;
}
```

#### Number Transformations
```typescript
export class ProductDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @Transform(({ value }) => Math.round(value * 100) / 100)
  @IsNumber()
  discount: number;
}
```

#### String Transformations
```typescript
export class ProfileDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) => value?.toLowerCase())
  @IsEmail()
  email: string;

  @Transform(({ value }) => value?.replace(/\s+/g, ' ').trim())
  @IsString()
  bio: string;
}
```

---

## Nested Object Validation

### Validating Nested Objects (Q63)

Use `@ValidateNested()` and `@Type()` decorators to validate nested objects and arrays.

**Basic Nested Validation:**
```typescript
import { ValidateNested, Type } from 'class-validator';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @Matches(/^\d{5}(-\d{4})?$/)
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class ContactInfoDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+?[\d\s\-\(\)]+$/)
  phone: string;

  @IsOptional()
  @IsString()
  website?: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;
}
```

**Complex Nested Structures:**
```typescript
export class SocialMediaDto {
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @IsOptional()
  @IsUrl()
  twitter?: string;

  @IsOptional()
  @IsUrl()
  linkedin?: string;
}

export class CompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  industry: string;

  @ValidateNested()
  @Type(() => AddressDto)
  headquarters: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;
}

export class EmployeeDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ValidateNested()
  @Type(() => CompanyDto)
  company: CompanyDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  previousAddresses: AddressDto[];
}
```

**Nested Arrays with Validation:**
```typescript
export class SkillDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
  level: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  rating: number;
}

export class ProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  requiredSkills: SkillDto[];
}

export class DeveloperDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills: SkillDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects: ProjectDto[];
}
```

---

## Custom Validation Decorators

### Creating Custom Validation Decorators (Q64)

Create custom validation decorators for specific business rules.

**Simple Custom Validator:**
```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== 'string') {
            return false;
          }

          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          const isLongEnough = value.length >= 8;

          return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters`;
        },
      },
    });
  };
}

// Usage
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
```

**Advanced Custom Validator with Parameters:**
```typescript
export function IsDateRange(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateRange',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          
          if (!value || !relatedValue) {
            return false;
          }

          const startDate = new Date(relatedValue);
          const endDate = new Date(value);

          return startDate < endDate;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be after ${relatedPropertyName}`;
        },
      },
    });
  };
}

export class EventDto {
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsDateRange('startDate')
  endDate: Date;
}
```

**Async Custom Validator:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async isEmailUnique(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    return !user;
  }
}

export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        async validate(value: any, args: ValidationArguments) {
          // Note: This requires dependency injection setup
          // In practice, you'd use a custom validation pipe or service
          return true; // Simplified for example
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be unique`;
        },
      },
    });
  };
}
```

**Custom Validator Class:**
```typescript
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class CustomTextValidator implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    // Custom validation logic
    return text && text.length > 0 && text.length <= 20 && /^[a-zA-Z0-9]+$/.test(text);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Text ($value) must be alphanumeric and between 1-20 characters';
  }
}

export class CustomDto {
  @Validate(CustomTextValidator)
  customField: string;
}
```

---

## Validation vs Transformation

### Difference Between Validation and Transformation (Q65)

**Validation** verifies that data meets certain criteria without changing it.
**Transformation** modifies or converts data from one form to another.

**Validation Example:**
```typescript
export class ValidationOnlyDto {
  @IsString()           // Validates that it's a string
  @IsNotEmpty()         // Validates that it's not empty
  @MinLength(3)         // Validates minimum length
  name: string;

  @IsNumber()           // Validates that it's a number
  @Min(0)              // Validates minimum value
  @Max(100)            // Validates maximum value
  age: number;

  @IsEmail()           // Validates email format
  email: string;
}
```

**Transformation Example:**
```typescript
export class TransformationDto {
  @Transform(({ value }) => value?.trim())     // Transforms by trimming whitespace
  @IsString()
  name: string;

  @Transform(({ value }) => parseInt(value))   // Transforms string to number
  @IsNumber()
  age: number;

  @Transform(({ value }) => value?.toLowerCase()) // Transforms to lowercase
  @IsEmail()
  email: string;

  @Type(() => Date)                            // Transforms to Date object
  @IsDate()
  birthDate: Date;

  @Transform(({ value }) => value === 'true' || value === true) // Transforms to boolean
  @IsBoolean()
  isActive: boolean;
}
```

**Combined Validation and Transformation:**
```typescript
export class CombinedDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @Transform(({ value }) => value?.toLowerCase()?.trim())
  @IsEmail()
  email: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsNumber()
  @Min(0)
  salary: number;

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => item?.toString()?.toLowerCase()?.trim()).filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  skills: string[];
}
```

---

## Optional Fields Handling

### @IsOptional() Decorator (Q68)

The `@IsOptional()` decorator skips validation if the property is undefined or null.

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()    // This field can be undefined/null
  @IsString()
  @MinLength(2)
  middleName?: string;

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: string[];
}
```

### Optional Fields in Different Contexts (Q66)

**Using Default Values:**
```typescript
export class SettingsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== undefined ? value : true)
  notifications?: boolean = true;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || 'light')
  theme?: string = 'light';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => value !== undefined ? value : 10)
  itemsPerPage?: number = 10;
}
```

**Conditional Optional Fields:**
```typescript
export class PaymentDto {
  @IsEnum(['credit_card', 'paypal', 'bank_transfer'])
  method: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{16}$/)
  // Only required when method is 'credit_card'
  creditCardNumber?: string;

  @IsOptional()
  @IsEmail()
  // Only required when method is 'paypal'
  paypalEmail?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9,18}$/)
  // Only required when method is 'bank_transfer'
  bankAccount?: string;
}
```

**Handling Partial Updates:**
```typescript
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(120)
  age?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
```

---

## Conditional Validation

### Implementing Conditional Validation (Q67)

Conditional validation applies validation rules based on the values of other fields.

**Using Custom Validator:**
```typescript
function IsRequiredIf(property: string, value: any, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredIf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property, value],
      options: validationOptions,
      validator: {
        validate(propertyValue: any, args: ValidationArguments) {
          const [relatedPropertyName, relatedValue] = args.constraints;
          const relatedPropertyValue = (args.object as any)[relatedPropertyName];
          
          if (relatedPropertyValue === relatedValue) {
            return propertyValue !== undefined && propertyValue !== null && propertyValue !== '';
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName, relatedValue] = args.constraints;
          return `${args.property} is required when ${relatedPropertyName} is ${relatedValue}`;
        },
      },
    });
  };
}

export class ShippingDto {
  @IsEnum(['home', 'office', 'pickup'])
  deliveryType: string;

  @IsRequiredIf('deliveryType', 'home')
  @IsString()
  homeAddress?: string;

  @IsRequiredIf('deliveryType', 'office')
  @IsString()
  officeAddress?: string;

  @IsRequiredIf('deliveryType', 'pickup')
  @IsString()
  pickupLocation?: string;
}
```

**Complex Conditional Validation:**
```typescript
function ValidateIf(condition: (obj: any) => boolean, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateIf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [condition],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [conditionFn] = args.constraints;
          
          if (conditionFn(args.object)) {
            // Apply validation only if condition is true
            return value !== undefined && value !== null && value !== '';
          }
          return true;
        },
      },
    });
  };
}

export class AdvancedOrderDto {
  @IsEnum(['standard', 'express', 'overnight'])
  shippingType: string;

  @IsBoolean()
  requiresSignature: boolean;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ValidateIf((obj) => obj.shippingType === 'express' || obj.shippingType === 'overnight')
  @IsString()
  @IsNotEmpty()
  expressInstructions?: string;

  @ValidateIf((obj) => obj.requiresSignature)
  @IsString()
  @IsNotEmpty()
  signatureContactName?: string;

  @ValidateIf((obj) => obj.totalAmount > 1000)
  @IsString()
  @IsNotEmpty()
  managerApproval?: string;
}
```

**Group-based Conditional Validation:**
```typescript
export class UserRegistrationDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsEnum(['individual', 'business'])
  accountType: string;

  // Individual account fields
  @ValidateIf((obj) => obj.accountType === 'individual')
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ValidateIf((obj) => obj.accountType === 'individual')
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ValidateIf((obj) => obj.accountType === 'individual')
  @IsString()
  @Matches(/^\d{3}-\d{2}-\d{4}$/)
  socialSecurityNumber?: string;

  // Business account fields
  @ValidateIf((obj) => obj.accountType === 'business')
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @ValidateIf((obj) => obj.accountType === 'business')
  @IsString()
  @Matches(/^\d{2}-\d{7}$/)
  taxId?: string;

  @ValidateIf((obj) => obj.accountType === 'business')
  @IsArray()
  @IsString({ each: true })
  businessLicenses?: string[];
}
```

---

## Array Validation

### Validating Arrays (Q70)

Validate arrays and their elements using specific decorators.

**Basic Array Validation:**
```typescript
export class ArrayValidationDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags: string[];

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(100, { each: true })
  scores: number[];

  @IsArray()
  @IsEmail({}, { each: true })
  emailList: string[];

  @IsArray()
  @IsUrl({}, { each: true })
  urls: string[];

  @IsArray()
  @IsBoolean({ each: true })
  flags: boolean[];
}
```

**Complex Array Validation:**
```typescript
export class ItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategories?: string[];
}

export class ShoppingCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  categories: CategoryDto[];

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  appliedCoupons: string[];

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @ArrayNotEmpty()
  taxRates: number[];
}
```

**Array Transformation:**
```typescript
export class ArrayTransformationDto {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  commaSeparatedTags: string[];

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => parseFloat(item)).filter(num => !isNaN(num));
    }
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  numericStrings: number[];

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return [...new Set(value)]; // Remove duplicates
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  uniqueItems: string[];
}
```

**Array Size and Content Validation:**
```typescript
export class ArraySizeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  limitedTags: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsNumber({}, { each: true })
  uniqueNumbers: number[];

  @IsArray()
  @ArrayContains(['required-item'])
  @IsString({ each: true })
  mustContainSpecificItem: string[];

  @IsArray()
  @ArrayNotContains(['forbidden-item'])
  @IsString({ each: true })
  cannotContainSpecificItem: string[];
}
```

---

## @Transform() Decorator

### Understanding @Transform() Decorator (Q69)

The `@Transform()` decorator modifies incoming data before validation occurs.

**Basic Transformations:**
```typescript
export class TransformDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) => value?.toLowerCase())
  @IsEmail()
  email: string;

  @Transform(({ value }) => value?.toUpperCase())
  @IsString()
  countryCode: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  age: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  salary: number;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive: boolean;
}
```

**Advanced Transformations:**
```typescript
export class AdvancedTransformDto {
  // Remove extra spaces and capitalize
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.replace(/\s+/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase());
    }
    return value;
  })
  @IsString()
  fullName: string;

  // Clean phone number
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.replace(/[^\d]/g, '');
    }
    return value;
  })
  @IsString()
  @Matches(/^\d{10}$/)
  phoneNumber: string;

  // Convert string array to numbers
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => {
        const num = parseFloat(item);
        return isNaN(num) ? item : num;
      });
    }
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  scores: number[];

  // Parse JSON string
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  metadata: object;
}
```

**Conditional Transformations:**
```typescript
export class ConditionalTransformDto {
  @IsEnum(['user', 'admin', 'moderator'])
  role: string;

  @Transform(({ value, obj }) => {
    // Transform based on role
    if (obj.role === 'admin') {
      return value?.toUpperCase();
    }
    return value?.toLowerCase();
  })
  @IsString()
  username: string;

  @Transform(({ value, obj }) => {
    // Different validation based on role
    if (obj.role === 'admin') {
      return value; // Admin can have any email
    }
    return value?.toLowerCase(); // Others get normalized email
  })
  @IsEmail()
  email: string;
}
```

---

## Advanced Patterns

### Custom Validation Groups
```typescript
export class UserDto {
  @IsString({ groups: ['create', 'update'] })
  @IsNotEmpty({ groups: ['create'] })
  name: string;

  @IsEmail({ groups: ['create', 'update'] })
  email: string;

  @IsString({ groups: ['create'] })
  @MinLength(8, { groups: ['create'] })
  password: string;

  @IsOptional({ groups: ['update'] })
  @IsString({ groups: ['update'] })
  currentPassword?: string;
}

// Usage in controller
@Post()
async create(@Body(new ValidationPipe({ groups: ['create'] })) dto: UserDto) {
  return this.userService.create(dto);
}

@Put(':id')
async update(@Body(new ValidationPipe({ groups: ['update'] })) dto: UserDto) {
  return this.userService.update(dto);
}
```

### Validation Error Formatting
```typescript
import { ValidationError } from 'class-validator';

export class ValidationErrorFormatter {
  static formatErrors(errors: ValidationError[]): any {
    const result = {};
    
    errors.forEach(error => {
      if (error.children && error.children.length > 0) {
        result[error.property] = this.formatErrors(error.children);
      } else {
        result[error.property] = Object.values(error.constraints || {});
      }
    });
    
    return result;
  }
}

// Custom validation pipe
@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = ValidationErrorFormatter.formatErrors(errors);
        return new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    });
  }
}
```

### Sanitization with Validation
```typescript
export class SanitizedDto {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Remove HTML tags and trim
      return value.replace(/<[^>]*>?/gm, '').trim();
    }
    return value;
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Remove SQL injection attempts
      return value.replace(/['";\\]/g, '');
    }
    return value;
  })
  @IsString()
  searchQuery: string;
}
```

---

## Best Practices

### 1. Proper DTO Structure
```typescript
// ✅ Good - Clear, focused DTOs
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(8)
  currentPassword?: string;
}

// ❌ Bad - Overly complex single DTO
export class UserDto {
  // Mixed create/update logic in one class
}
```

### 2. Error Handling
```typescript
// ✅ Good - Descriptive error messages
export class ProductDto {
  @IsString({ message: 'Product name must be a string' })
  @IsNotEmpty({ message: 'Product name cannot be empty' })
  @Length(3, 50, { message: 'Product name must be between 3 and 50 characters' })
  name: string;

  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0.01, { message: 'Price must be greater than 0' })
  @Max(999999.99, { message: 'Price cannot exceed $999,999.99' })
  price: number;
}
```

### 3. Performance Optimization
```typescript
// ✅ Good - Efficient validation
export class OptimizedDto {
  @IsString()
  @Length(1, 100) // More specific than @IsNotEmpty() + @MaxLength()
  name: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase()) // Transform once
  email: string;
}

// ❌ Bad - Inefficient validation
export class IneffientDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string; // Redundant validations
}
```

---

## Study Plan

### Week 1: Fundamentals
- **Days 1-2**: class-validator basics and common decorators
- **Days 3-4**: class-transformer and data transformation
- **Days 5-7**: Nested object validation and complex structures

### Week 2: Advanced Validation
- **Days 1-3**: Custom validation decorators and complex business rules
- **Days 4-5**: Conditional validation patterns
- **Days 6-7**: Array validation and transformation

### Week 3: Integration & Patterns
- **Days 1-2**: ValidationPipe configuration and optimization
- **Days 3-4**: Error handling and formatting
- **Days 5-7**: Advanced patterns and performance optimization

### Week 4: Real-World Application
- **Days 1-3**: Complex validation scenarios
- **Days 4-5**: Security considerations and sanitization
- **Days 6-7**: Testing validation logic

### Hands-On Projects:
1. **User Management System** - Complete validation with nested objects
2. **E-commerce Platform** - Complex business rule validation
3. **Form Builder** - Dynamic validation based on form configuration
4. **API Gateway** - Request/response transformation and validation

### Key Concepts to Master:
- **Decorator Usage** - Know when and how to use each validator
- **Transformation Logic** - Clean and transform data effectively
- **Custom Validators** - Create reusable business rule validation
- **Error Handling** - Provide meaningful feedback to clients
- **Performance** - Optimize validation for large-scale applications
- **Security** - Sanitize input to prevent attacks

This comprehensive guide covers all aspects of validation and transformation in NestJS, providing you with the knowledge needed to answer questions 61-70 confidently in technical interviews.