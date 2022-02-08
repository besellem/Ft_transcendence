import { Inject, Injectable } from '@nestjs/common';

import { UserService } from 'src/user/user.service';
import { LimitedUserDto, UserDto } from 'src/user/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(@Inject('USER_SERVICE') private readonly userService: UserService) {}

  public async valideUser(user: LimitedUserDto): Promise<void> {
    await this.userService.updateUserByAuth(user);
  }

}