import {
    Body,
    Controller,
    Patch,
    Post,
    Put,
    Request,
    Response,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CookieOptions, Response as ExpressResponse } from 'express';
import { User } from 'src/users/entities/user.entity';
import { RefreshGuard } from './guards/refresh.guard';
import { EmailDto, UserCredentialsDto } from './dto/user-credentials.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { getDaysMilliseconds } from '../util/jwt-time-to-ms';
import { AccessTokenDto } from './interfaces/auth-tokens.interface';
import { ApiCreatedResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Routes with authentication-related functionality.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController
{
    /**
     * Secure cookie flag.
     * @private
     */
    private readonly SECURE: boolean;
    /**
     * Same site cookie flag.
     * @private
     */
    private readonly SAME_SITE: boolean | 'lax' | 'strict' | 'none';
    /**
     * Milliseconds lifespan of a refresh token.
     * Once a refresh token is generated, it will be valid during this time interval.
     * @private
     */
    private readonly REFRESH_EXPIRATION_MILLISECONDS: number;
    
    
    /**
     * Class constructor.
     * Initializes service dependencies and configuration data.
     * @param authService
     * @param configService
     */
    constructor(private readonly authService: AuthService,
                private readonly configService: ConfigService)
    {
        this.SECURE = this.configService.get<string>('SECURE') === 'true';
        this.SAME_SITE = this.configService.get('SAME_SITE');
        this.REFRESH_EXPIRATION_MILLISECONDS =
            getDaysMilliseconds(this.configService.get<string>('REFRESH_EXPIRATION'));
    }
    
    /**
     * <h2>Login</h2>
     * Authenticates a user through local auth <strong>(email and password).</strong>
     * If credentials are valid, an <code>access_token</code> is returned as a response and a
     * <code>refresh_token</code> is set as a cookie.
     * @param req An Express request which also contains a <code>User</code>, given that their credentials are valid.
     * @param res An Express response.
     * @param userCredentials An object containing a user's <code>email</code> and <code>password</code>.
     */
    @UseGuards(LocalAuthGuard)
    @Post()
    @ApiCreatedResponse({
        description: 'Successful login. Returns an <code>access_token</code> and sets a <code>refresh_token</code> cookie.',
        type: AccessTokenDto,
    })
    @ApiUnauthorizedResponse({ description: 'Wrong credentials or user hasn\'t confirmed their email yet.' })
    async login(@Request() req: AuthRequest<User>, @Response() res: ExpressResponse,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                @Body() userCredentials: UserCredentialsDto): Promise<void>
    {
        const { user } = req;
        if (!user.active)
        {
            throw new UnauthorizedException();
        }
        await this.sendAuthTokens(res, user);
    }
    
    @UseGuards(RefreshGuard)
    @Put()
    async refreshToken(@Request() req: AuthRequest<User>, @Response() res: ExpressResponse): Promise<void>
    {
        await this.sendAuthTokens(res, req.user);
    }
    
    @Post('password')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void>
    {
        await this.authService.resetPassword(resetPasswordDto);
    }
    
    @Put('password')
    async generatePasswordResetToken(@Body() emailDto: EmailDto): Promise<{ expiresAt: Date }>
    {
        return await this.authService.sendPasswordResetToken(emailDto.email);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch('password')
    async updatePassword(@Request() req: AuthRequest<User>, @Body() changePasswordDto: UpdatePasswordDto): Promise<void>
    {
        await this.authService.updatePassword(req.user, changePasswordDto);
    }
    
    @UseGuards(LocalAuthGuard)
    @Post('email')
    async confirmEmailAndSignIn(@Request() req: AuthRequest<User>, @Response() res: ExpressResponse,
                                @Body('token') confirmationToken: string): Promise<void>
    {
        const { user } = req;
        if (user.active)
        {
            throw new UnauthorizedException();
        }
        await this.authService.confirmEmail(user, confirmationToken);
        await this.sendAuthTokens(res, user);
    }
    
    async sendAuthTokens(res: ExpressResponse, user: User): Promise<void>
    {
        const { access_token, refresh_token } = await this.authService.generateAuthTokens(user);
        
        const cookieOptions: CookieOptions = {
            httpOnly: true,
            secure: this.SECURE,
            sameSite: this.SAME_SITE,
            expires: new Date(Date.now() + this.REFRESH_EXPIRATION_MILLISECONDS),
            path: '/auth',
        };
        
        res.cookie('refresh_token', refresh_token, cookieOptions);
        res.json({ access_token });
    }
}
