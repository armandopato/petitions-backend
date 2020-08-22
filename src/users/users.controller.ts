import { Controller, Post, Body } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserService } from './users.service';
import { CreateUserRes } from './dto/create-user-res.dto';

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Post()
    async signUp(@Body() createUserDto: CreateUserDto): Promise<CreateUserRes>
    {
        return await this.userService.createUser(createUserDto);
    }

    // add and delete support team user
}
