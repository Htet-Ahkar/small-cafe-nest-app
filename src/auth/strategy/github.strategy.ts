import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID'),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const email = profile.emails[0]?.value;
    const allowedAdmins = this.configService
      .get<string>('ADMIN_EMAILS')
      .split(',');

    if (!allowedAdmins.includes(email)) {
      throw new UnauthorizedException('You are not authorized as an admin');
    }

    // Check if admin exists
    let admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      admin = await this.prisma.admin.create({
        data: { email },
      });
    }

    return admin;
  }
}
