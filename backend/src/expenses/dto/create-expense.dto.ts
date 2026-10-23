import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxDate,
  MaxLength,
  Validate,
} from 'class-validator';
import { ExpenseCategory } from '../enums/expense-category.enum';
import { DemoSafeTextValidator } from '../validators/demo-safe-text.validator';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Validate(DemoSafeTextValidator)
  merchant: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999999.99, { message: 'amount must not exceed 99,999,999.99' })
  amount: number;

  @IsEnum(ExpenseCategory, {
    message:
      'category must be one of: Cooked Meals, Non-Cooked Meals, Non-Food',
  })
  category: ExpenseCategory;

  @Type(() => Date)
  @IsDate({ message: 'date must be a valid ISO 8601 date' })
  @MaxDate(() => new Date(), { message: 'date must not be in the future' })
  date: Date;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Validate(DemoSafeTextValidator)
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  @Validate(DemoSafeTextValidator)
  description?: string;
}
