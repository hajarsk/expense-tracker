import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { json } from 'express';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    app.use(json({ limit: '16kb' }));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Expense Tracker API');
  });

  it('rejects JSON bodies larger than 16 KB before reaching the database', () => {
    return request(app.getHttpServer())
      .post('/expenses')
      .send({ description: 'x'.repeat(17 * 1024) })
      .expect(413);
  });

  it('enforces the shared write limit across public write routes', async () => {
    for (let index = 0; index < 15; index += 1) {
      const testRequest = request(app.getHttpServer());
      const response =
        index % 2 === 0
          ? await testRequest.post('/expenses').send({ internalField: true })
          : await testRequest
              .patch('/expenses/1')
              .send({ internalField: true });
      expect(response.status).toBe(400);
    }

    await request(app.getHttpServer()).delete('/expenses/1').expect(429);
  });
});
