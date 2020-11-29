import { Body, Controller, Get, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAdminGuard } from '../auth/guards/is-admin.guard';
import { UpdatePrivilegesDto } from './dto/update-privileges.dto';
import { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { MeGuard } from '../auth/guards/me.guard';
import { UpdateSchoolDto, UpdateSettingsDto, UserSettingsAndSchoolDto } from './dto/user-settings.dto';
import { User } from './entities/user.entity';
import { ApiTags } from '@nestjs/swagger';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController
{
    constructor(private readonly usersService: UsersService)
    {
    }
    
    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<void>
    {
        await this.usersService.create(createUserDto);
    }
    
    @UseGuards(JwtAuthGuard, MeGuard)
    @Put()
    async updatePrivileges(@Body() updatePrivilegesDto: UpdatePrivilegesDto): Promise<void>
    {
        return await this.usersService.updatePrivileges(updatePrivilegesDto);
    }
    
    @UseGuards(JwtAuthGuard, IsAdminGuard)
    @Patch()
    async updateRole(@Body() updateRoleDto: UpdateRoleDto, @Request() req: AuthRequest<User>): Promise<void>
    {
        return await this.usersService.updateRole(updateRoleDto, req.user);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('settings')
    getSettingsAndSchool(@Request() req: AuthRequest<User>): UserSettingsAndSchoolDto
    {
        return this.usersService.getSettingsAndSchool(req.user);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch('settings')
    async updateSettings(@Request() req: AuthRequest<User>,
                         @Body() updateSettingsDto: UpdateSettingsDto): Promise<void>
    {
        await this.usersService.updateSettings(req.user, updateSettingsDto);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch('school')
    async updateSchool(@Request() req: AuthRequest<User>, @Body() updateSchoolDto: UpdateSchoolDto): Promise<void>
    {
        await this.usersService.updateSchool(req.user, updateSchoolDto.newCampus);
    }
}
