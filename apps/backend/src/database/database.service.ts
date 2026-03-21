import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { randomUUID } from 'node:crypto';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'naughtybox',
    password: process.env.DB_PASSWORD ?? 'naughtybox',
    database: process.env.DB_NAME ?? 'naughtybox',
  });

  async onModuleInit() {
    await this.ensureSchema();
    await this.seedDemoData();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    return this.pool.query<T>(text, values);
  }

  private async ensureSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS creator_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        bio TEXT NOT NULL DEFAULT '',
        avatar_url TEXT,
        cover_image_url TEXT,
        accent_color TEXT,
        tags TEXT[] NOT NULL DEFAULT '{}',
        age INTEGER,
        gender TEXT,
        country TEXT,
        city TEXT,
        interested_in TEXT,
        relationship_status TEXT,
        body_type TEXT,
        languages TEXT[] NOT NULL DEFAULT '{}',
        categories TEXT[] NOT NULL DEFAULT '{}',
        subcategories TEXT[] NOT NULL DEFAULT '{}',
        instagram_url TEXT,
        x_url TEXT,
        website_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS creator_rooms (
        id TEXT PRIMARY KEY,
        creator_profile_id TEXT NOT NULL UNIQUE REFERENCES creator_profiles(id) ON DELETE CASCADE,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        tags TEXT[] NOT NULL DEFAULT '{}',
        stream_key TEXT NOT NULL UNIQUE,
        is_public BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS token_wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS token_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        room_slug TEXT,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS room_chat_messages (
        id TEXT PRIMARY KEY,
        room_slug TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_name TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_provider_configs (
        id TEXT PRIMARY KEY,
        provider_key TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'researching',
        notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS country TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS interested_in TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS relationship_status TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS body_type TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS subcategories TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS x_url TEXT;
      ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
    `);

    this.logger.log('Database schema ready.');
  }

  private async seedDemoData() {
    const existingUsers = await this.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');

    if (Number(existingUsers.rows[0]?.count ?? 0) > 0) {
      return;
    }

    const creators = [
      {
        email: 'nora@naughtybox.local',
        username: 'noravale',
        displayName: 'Nora Vale',
        slug: 'nora-after-dark',
        title: 'Nora After Dark',
        description: 'Sala seed para validar el lobby principal sin depender de personajes virtuales.',
        tags: ['night', 'spanish', 'creator'],
        avatarUrl: null,
        coverImageUrl:
          'linear-gradient(135deg, rgba(255,89,116,0.32), rgba(27,183,167,0.22), rgba(16,11,24,0.92))',
        accentColor: '#ff5b73',
        age: 24,
        gender: 'woman',
        country: 'Spain',
        city: 'Madrid',
        interestedIn: 'Men, Women',
        relationshipStatus: 'Open',
        bodyType: 'Slim',
        languages: ['Spanish', 'English'],
        categories: ['girls', 'solo'],
        subcategories: ['vip', 'private-shows', 'fetish-friendly'],
        instagramUrl: 'https://instagram.com/nora.demo',
        xUrl: 'https://x.com/nora_demo',
        websiteUrl: 'https://naughtybox.local/nora',
      },
      {
        email: 'luna@naughtybox.local',
        username: 'lunavega',
        displayName: 'Luna Vega',
        slug: 'luna-en-directo',
        title: 'Luna en directo',
        description: 'Sala demo para testear descubrimiento, estado live y navegacion del lobby.',
        tags: ['public', 'es', 'lobby'],
        avatarUrl: null,
        coverImageUrl:
          'linear-gradient(135deg, rgba(27,183,167,0.28), rgba(255,143,115,0.18), rgba(15,10,22,0.92))',
        accentColor: '#ff8f73',
        age: 22,
        gender: 'woman',
        country: 'Argentina',
        city: 'Buenos Aires',
        interestedIn: 'Men, Couples',
        relationshipStatus: 'Single',
        bodyType: 'Athletic',
        languages: ['Spanish'],
        categories: ['girls', 'latina'],
        subcategories: ['new', 'chatty', 'games'],
        instagramUrl: 'https://instagram.com/luna.demo',
        xUrl: 'https://x.com/luna_demo',
        websiteUrl: 'https://naughtybox.local/luna',
      },
      {
        email: 'jade@naughtybox.local',
        username: 'jadesol',
        displayName: 'Jade Sol',
        slug: 'jade-after-hours',
        title: 'Jade After Hours',
        description: 'Sala demo para contrastar tono visual, tags y jerarquia de contenido.',
        tags: ['afterhours', 'vip', 'demo'],
        avatarUrl: null,
        coverImageUrl:
          'linear-gradient(135deg, rgba(255,143,115,0.26), rgba(255,89,116,0.22), rgba(17,11,23,0.92))',
        accentColor: '#18a89f',
        age: 27,
        gender: 'woman',
        country: 'Mexico',
        city: 'CDMX',
        interestedIn: 'Men, Women',
        relationshipStatus: 'Open',
        bodyType: 'Curvy',
        languages: ['Spanish', 'English'],
        categories: ['girls', 'vip'],
        subcategories: ['afterhours', 'fetish', 'couples'],
        instagramUrl: 'https://instagram.com/jade.demo',
        xUrl: 'https://x.com/jade_demo',
        websiteUrl: 'https://naughtybox.local/jade',
      },
    ] as const;

    for (const creator of creators) {
      const userId = randomUUID();
      const profileId = randomUUID();
      await this.query(
        `INSERT INTO users (id, email, username, password_hash, role)
         VALUES ($1, $2, $3, $4, 'creator')`,
        [userId, creator.email, creator.username, 'demo-disabled-login'],
      );
      await this.query(
        `INSERT INTO creator_profiles (
           id, user_id, display_name, slug, bio, avatar_url, cover_image_url, accent_color, tags,
           age, gender, country, city, interested_in, relationship_status, body_type,
           languages, categories, subcategories, instagram_url, x_url, website_url
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11, $12, $13, $14, $15, $16,
           $17, $18, $19, $20, $21, $22
         )`,
        [
          profileId,
          userId,
          creator.displayName,
          creator.slug,
          `${creator.displayName} es un perfil demo usado para validar la fase actual del producto.`,
          creator.avatarUrl,
          creator.coverImageUrl,
          creator.accentColor,
          creator.tags,
          creator.age,
          creator.gender,
          creator.country,
          creator.city,
          creator.interestedIn,
          creator.relationshipStatus,
          creator.bodyType,
          creator.languages,
          creator.categories,
          creator.subcategories,
          creator.instagramUrl,
          creator.xUrl,
          creator.websiteUrl,
        ],
      );
      await this.query(
        `INSERT INTO creator_rooms (id, creator_profile_id, slug, title, description, tags, stream_key, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
        [randomUUID(), profileId, creator.slug, creator.title, creator.description, creator.tags, creator.slug],
      );
      await this.query(`INSERT INTO token_wallets (id, user_id, balance) VALUES ($1, $2, 0)`, [
        randomUUID(),
        userId,
      ]);

      await this.query(
        `INSERT INTO token_transactions (id, user_id, room_slug, type, amount, balance_after, description)
         VALUES ($1, $2, NULL, 'credit', 0, 0, 'Initial wallet seed')`,
        [randomUUID(), userId],
      );
    }

    const providers = [
      ['ccbill', 'researching', 'Adult-friendly processor candidate for cards.'],
      ['segpay', 'researching', 'Adult-friendly processor candidate for recurring billing.'],
      ['crypto', 'planned', 'Optional crypto rail for later token top-ups and payouts.'],
    ] as const;

    for (const [providerKey, status, notes] of providers) {
      await this.query(
        `INSERT INTO payment_provider_configs (id, provider_key, status, notes)
         VALUES ($1, $2, $3, $4)`,
        [randomUUID(), providerKey, status, notes],
      );
    }

    this.logger.log('Demo data seeded.');
  }
}
