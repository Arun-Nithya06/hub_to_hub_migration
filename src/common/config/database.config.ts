import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Batch, Association, Call, Company, Contact, Deal, Email, Meeting, Task, Note, PropertyMapping } from '../entities/';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT as string) || 5432,
  username: (process.env.DB_USER as string) || 'postgres',
  password: (process.env.DB_PASSWORD as string) || 'postgres',
  database: process.env.DB_NAME || 'hubspot_migration',
  entities: [Batch, Contact, Company, Deal, Email, Call, Meeting, Task, Note, Association, PropertyMapping],
  synchronize: true,
  logging: process.env.NODE_ENV === 'dev',
  poolSize: 50,
  extra: {
    connectionLimit: 50,
  },
};
