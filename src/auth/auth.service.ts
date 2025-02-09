import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async signup(dto: AuthDto) {
    try {
      // generate password hash
      const hash = await argon.hash(dto.password);

      // save the new user in the db
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          hash,
          // firstName: dto.firstName,
          // lastName: dto.lastName,
        },
      });

      delete user.hash;

      // return the saved user
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }

      throw error;
    }
  }

  async signin(dto: AuthDto) {
    // find the user by email
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // if user does not exist throw exception
    if (!user) throw new ForbiddenException('User do not exist.');

    // compare password
    const isPasswordMatch = await argon.verify(user.hash, dto.password);
    // if password incorrect throw exception
    if (!isPasswordMatch)
      throw new ForbiddenException('Credentials incorrect.');

    delete user.hash;
    // return the user
    return user;
  }
}
