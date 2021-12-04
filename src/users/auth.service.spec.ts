import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    //Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email) => {
        const filtertedUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filtertedUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('test@test.ph', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('diablo@diablo.com', 'mypassword');
    await expect(
      service.signup('diablo@diablo.com', 'mypassword'),
    ).rejects.toThrowError(BadRequestException);
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(
      service.signin('sadas@acasdasdasd', 'screw1'),
    ).rejects.toThrowError(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('diablo@diablo.com', 'mypassword');

    await expect(
      service.signin('diablo@diablo.com', 'mypassword1'),
    ).rejects.toThrowError(BadRequestException);
  });

  it('returns a user if correct password is provided', async () => {
    // fakeUsersService.find = () =>
    //   Promise.resolve([
    //     {
    //       email: 'diablo@diablo.com',
    //       password:
    //         'd94999a86ac1a0d1.3ab52f230271b542a828c600fab4b6ae1cdff590381ed7acb8933119d3631861',
    //     } as User,
    //   ]);

    await service.signup('diablo@diablo.com', 'mypassword');
    const user = await service.signin('diablo@diablo.com', 'mypassword');
    expect(user).toBeDefined();
  });
});
