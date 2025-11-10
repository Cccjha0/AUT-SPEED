import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './guards/roles.guard';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'speed-dev-secret',
      signOptions: { expiresIn: '8h' }
    }),
    forwardRef(() => StaffModule)
  ],
  controllers: [AuthController],
  providers: [AuthService, RolesGuard],
  exports: [AuthService, RolesGuard]
})
export class AuthModule {}
