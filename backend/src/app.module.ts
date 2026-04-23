import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';
import { AssetsModule } from './assets/assets.module';
import { SopModule } from './sop/sop.module';
import { FinancialsModule } from './financials/financials.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    SuppliersModule,
    IngredientsModule,
    RecipesModule,
    AssetsModule,
    SopModule,
    FinancialsModule,
  ],
})
export class AppModule {}
