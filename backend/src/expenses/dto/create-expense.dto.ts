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
} from 'class-validator';
import { ExpenseCategory } from '../enums/expense-category.enum';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
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
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
