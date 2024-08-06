import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './dto/user.dto';

@Injectable()
export class UserService {
  private users: User[] = [
    {
      id: '1',
      name: 'John Doe',
    },
    {
      id: '2',
      name: 'Jane Doe',
    },
    {
      id: '3',
      name: 'Alice',
    },
    {
      id: '4',
      name: 'Bob',
    },
  ];

  getUserById(id: string): User {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    return user;
  }
}
