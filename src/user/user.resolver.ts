import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { User } from './dto/user.dto';
import { UserService } from './user.service';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  users(): User[] {
    return this.userService.getAllUsers();
  }

  @Query(() => User)
  user(@Args('id', { type: () => ID }) id: string): User {
    return this.userService.getUserById(id);
  }
}
