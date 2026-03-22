import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TipCreatorRequest, TokenTransaction, WalletSummary } from '@naughtybox/shared-types';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';

type WalletRow = {
  id: string;
  user_id: string;
  balance: number;
};

type TransactionRow = {
  id: string;
  user_id: string;
  room_slug: string | null;
  type: TokenTransaction['type'];
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
};

type RoomOwnerRow = {
  owner_user_id: string;
};

@Injectable()
export class WalletService {
  constructor(private readonly database: DatabaseService) {}

  async getWallet(userId: string): Promise<WalletSummary> {
    const wallet = await this.findWallet(userId);
    const transactions = await this.database.query<TransactionRow>(
      `SELECT * FROM token_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 12`,
      [userId],
    );

    return {
      balance: wallet.balance,
      recentTransactions: transactions.rows.map((row) => this.mapTransaction(row)),
    };
  }

  async addDevCredit(userId: string) {
    return this.applyWalletChange(userId, {
      amount: 250,
      roomSlug: null,
      type: 'credit',
      description: 'Development top-up for validation',
    });
  }

  async tipCreator(userId: string, payload: TipCreatorRequest) {
    if (!payload.roomSlug?.trim() || !Number.isInteger(payload.amount) || payload.amount <= 0) {
      throw new BadRequestException('A valid room slug and positive amount are required.');
    }

    const roomOwner = await this.database.query<RoomOwnerRow>(
      `
      SELECT users.id AS owner_user_id
      FROM creator_rooms rooms
      INNER JOIN creator_profiles profiles ON profiles.id = rooms.creator_profile_id
      INNER JOIN users ON users.id = profiles.user_id
      WHERE rooms.slug = $1
      LIMIT 1
      `,
      [payload.roomSlug],
    );

    const ownerUserId = roomOwner.rows[0]?.owner_user_id;
    if (!ownerUserId) {
      throw new NotFoundException('Creator room not found.');
    }

    if (ownerUserId === userId) {
      throw new BadRequestException('You cannot tip your own room.');
    }

    const senderWallet = await this.findWallet(userId);
    if (senderWallet.balance < payload.amount) {
      throw new BadRequestException('Insufficient token balance.');
    }

    const senderResult = await this.applyWalletChange(userId, {
      amount: -payload.amount,
      roomSlug: payload.roomSlug,
      type: 'tip_sent',
      description: payload.note?.trim() || `Tip sent to room ${payload.roomSlug}`,
    });

    await this.applyWalletChange(ownerUserId, {
      amount: payload.amount,
      roomSlug: payload.roomSlug,
      type: 'tip_received',
      description: payload.note?.trim() || `Tip received in room ${payload.roomSlug}`,
    });

    return senderResult;
  }

  async chargeForRoomAccess(userId: string, roomSlug: string, amount: number, description: string) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('A valid positive token amount is required.');
    }

    return this.applyWalletChange(userId, {
      amount: -amount,
      roomSlug,
      type: 'debit',
      description,
    });
  }

  private async findWallet(userId: string) {
    const result = await this.database.query<WalletRow>(
      `SELECT * FROM token_wallets WHERE user_id = $1 LIMIT 1`,
      [userId],
    );

    const wallet = result.rows[0];
    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    return wallet;
  }

  private async applyWalletChange(
    userId: string,
    input: {
      amount: number;
      roomSlug: string | null;
      type: TokenTransaction['type'];
      description: string;
    },
  ): Promise<WalletSummary> {
    const wallet = await this.findWallet(userId);
    const nextBalance = wallet.balance + input.amount;

    if (nextBalance < 0) {
      throw new BadRequestException('Wallet cannot go below zero.');
    }

    await this.database.query(
      `UPDATE token_wallets SET balance = $2, updated_at = NOW() WHERE user_id = $1`,
      [userId, nextBalance],
    );

    await this.database.query(
      `INSERT INTO token_transactions (
         id, user_id, room_slug, type, amount, balance_after, description
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        userId,
        input.roomSlug,
        input.type,
        input.amount,
        nextBalance,
        input.description,
      ],
    );

    return this.getWallet(userId);
  }

  private mapTransaction(row: TransactionRow): TokenTransaction {
    return {
      id: row.id,
      userId: row.user_id,
      roomSlug: row.room_slug ?? undefined,
      type: row.type,
      amount: row.amount,
      balanceAfter: row.balance_after,
      description: row.description,
      createdAt: row.created_at,
    };
  }
}
