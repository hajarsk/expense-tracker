import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExpensesModule } from './expenses/expenses.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DemoRateLimitGuard } from './security/demo-rate-limit.guard';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ExpensesModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: DemoRateLimitGuard }],
})
export class AppModule {}
