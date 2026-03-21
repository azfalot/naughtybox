import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@naughtybox/shared-types';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: User['role'];
  created_at: string;
  password_hash: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async createUser(input: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    const existing = await this.database.query<UserRow>(
      `SELECT * FROM users WHERE email = $1 OR username = $2`,
      [input.email, input.username],
    );

    if (existing.rows.length > 0) {
      throw new ConflictException('Email or username already in use.');
    }

    const id = randomUUID();
    const result = await this.database.query<UserRow>(
      `INSERT INTO users (id, email, username, password_hash, role)
       VALUES ($1, $2, $3, $4, 'viewer')
       RETURNING *`,
      [id, input.email, input.username, input.passwordHash],
    );

    await this.database.query(
      `INSERT INTO token_wallets (id, user_id, balance) VALUES ($1, $2, 0)`,
      [randomUUID(), id],
    );

    return this.mapUser(result.rows[0]);
  }

  async findUserWithPassword(identifier: string) {
    const result = await this.database.query<UserRow>(
      `SELECT * FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
      [identifier],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      user: this.mapUser(row),
      passwordHash: row.password_hash,
    };
  }

  async findById(id: string): Promise<User> {
    const result = await this.database.query<UserRow>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('User not found.');
    }
    return this.mapUser(row);
  }

  async setRole(id: string, role: User['role']) {
    const result = await this.database.query<UserRow>(
      `UPDATE users SET role = $2 WHERE id = $1 RETURNING *`,
      [id, role],
    );
    return this.mapUser(result.rows[0]);
  }

  private mapUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      role: row.role,
      createdAt: row.created_at,
    };
  }
}
