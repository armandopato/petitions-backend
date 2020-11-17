import { Body, Controller, Get, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAdminGuard } from '../auth/guards/is-admin.guard';
import { ModifyUserDto, ModifyUserRoleDto } from './dto/modify-user.dto';
import { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { MeGuard } from '../auth/guards/me.guard';
import { ChangeSchoolDto, ChangeUserSettingsDto, UserSettingsAndSchoolDto } from './dto/user-settings.dto';
import { User } from './entities/user.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController
{
    constructor(private readonly usersService: UsersService)
    {
    }
    
    @Post()
    async signUp(@Body() createUserDto: CreateUserDto): Promise<void>
    {
        await this.usersService.createUser(createUserDto);
    }
    
    @UseGuards(JwtAuthGuard, MeGuard)
    @Put()
    async modifyUser(@Body() modifyUserDto: ModifyUserDto): Promise<void>
    {
        return await this.usersService.updateUserPrivileges(modifyUserDto);
    }
    
    @UseGuards(JwtAuthGuard, IsAdminGuard)
    @Patch()
    async modifyUserRole(@Body() modifyUserRoleDto: ModifyUserRoleDto, @Request() req: AuthRequest<User>): Promise<void>
    {
        return await this.usersService.updateUserRole(modifyUserRoleDto, req.user);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('settings')
    getUserSettingsAndSchool(@Request() req: AuthRequest<User>): UserSettingsAndSchoolDto
    {
        return this.usersService.getUserSettingsAndSchool(req.user);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch('settings')
    async modifyUserSettings(@Request() req: AuthRequest<User>,
                             @Body() changeUserSettingsDto: ChangeUserSettingsDto): Promise<void>
    {
        await this.usersService.modifyUserSettings(req.user, changeUserSettingsDto);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch('school')
    async modifySchool(@Request() req: AuthRequest<User>, @Body() changeSchoolDto: ChangeSchoolDto): Promise<void>
    {
        await this.usersService.modifySchool(req.user, changeSchoolDto.newCampus);
    }
}
