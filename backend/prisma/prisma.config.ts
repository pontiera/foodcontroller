import path from 'path';

export default {
  schema: path.join(__dirname, 'schema.prisma'),
  datasourceUrl: process.env.DATABASE_URL,
}
