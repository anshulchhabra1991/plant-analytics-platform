import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
  isActive: boolean;
}

export class AuthService {
  private jwtSecret: string;
  private users: User[] = [];

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers(): void {
    // In a real application, this would come from a database
    // For demo purposes, we'll create some default users
    const defaultPassword = 'password123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 12);

    this.users = [
      {
        id: '1',
        email: 'admin@plantanalytics.com',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        roles: ['admin', 'user'],
        isActive: true,
      },
      {
        id: '2',
        email: 'user@plantanalytics.com',
        firstName: 'Regular',
        lastName: 'User',
        password: hashedPassword,
        roles: ['user'],
        isActive: true,
      },
    ];
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email && u.isActive);
    
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const newUser: User = {
      id: (this.users.length + 1).toString(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: hashedPassword,
      roles: ['user'],
      isActive: true,
    };

    this.users.push(newUser);
    return newUser;
  }

  getUserById(id: string): User | null {
    return this.users.find(u => u.id === id && u.isActive) || null;
  }

  getUserByEmail(email: string): User | null {
    return this.users.find(u => u.email === email && u.isActive) || null;
  }
} 