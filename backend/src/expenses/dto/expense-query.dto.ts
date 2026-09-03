import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ExpenseCategory } from '../enums/expense-category.enum';
import { ExpenseSort } from '../enums/expense-sort.enum';

export class ExpenseQueryDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDateExclusive?: string;

  @IsOptional()
  @IsEnum(ExpenseSort)
  sort: ExpenseSort = ExpenseSort.NEWEST;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-840)
  @Max(840)
  timezoneOffset = 0;
}
