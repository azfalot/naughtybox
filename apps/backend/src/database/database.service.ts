import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';

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
    const localCreators = [
      {
        email: 'demo.creator.20260321@naughtybox.local',
        username: 'democreator',
        password: 'Naughtybox123!',
        displayName: 'Lucia Velvet',
        slug: 'lucia-velvet-live',
        title: 'Lucia Velvet Live',
        description: 'Directos en espanol, sesiones privadas por tokens y contenido premium.',
        tags: ['spanish', 'vip', 'private-shows'],
        coverImageUrl: 'linear-gradient(135deg, rgba(21,159,149,0.34), rgba(255,138,61,0.22), rgba(7,18,20,0.94))',
        accentColor: '#ff8a3d',
        age: 26,
        gender: 'woman',
        country: 'Spain',
        city: 'Valencia',
        interestedIn: 'Men, Women, Couples',
        relationshipStatus: 'Open',
        bodyType: 'Curvy',
        languages: ['Spanish', 'English'],
        categories: ['girls', 'solo', 'vip'],
        subcategories: ['fetish', 'toys', 'private-shows', 'games'],
        instagramUrl: 'https://instagram.com/lucia.velvet.demo',
        xUrl: 'https://x.com/luciavelvetdemo',
        websiteUrl: 'https://naughtybox.local/lucia-velvet',
      },
      {
        email: 'luna@naughtybox.local',
        username: 'lunavega',
        password: 'demo-disabled-login',
        displayName: 'Luna Vega',
        slug: 'luna-en-directo',
        title: 'Luna en directo',
        description: 'Charla, juegos y directo diario en espanol.',
        tags: ['girls', 'new', 'public'],
        coverImageUrl: 'linear-gradient(135deg, rgba(21,159,149,0.30), rgba(255,138,61,0.18), rgba(7,18,20,0.94))',
        accentColor: '#159f95',
        age: 24,
        gender: 'woman',
        country: 'Spain',
        city: 'Madrid',
        interestedIn: 'Men, Couples',
        relationshipStatus: 'Single',
        bodyType: 'Athletic',
        languages: ['Spanish'],
        categories: ['girls', 'solo'],
        subcategories: ['chat', 'games', 'new'],
        instagramUrl: 'https://instagram.com/luna.demo',
        xUrl: 'https://x.com/luna_demo',
        websiteUrl: 'https://naughtybox.local/luna',
      },
      {
        email: 'jade@naughtybox.local',
        username: 'jadesol',
        password: 'demo-disabled-login',
        displayName: 'Jade Sol',
        slug: 'jade-after-hours',
        title: 'Jade After Hours',
        description: 'Sala premium pensada para afterhours, fetiches y privados.',
        tags: ['girls', 'vip', 'private-shows'],
        coverImageUrl: 'linear-gradient(135deg, rgba(255,138,61,0.24), rgba(21,159,149,0.18), rgba(7,18,20,0.94))',
        accentColor: '#ff8a3d',
        age: 27,
        gender: 'woman',
        country: 'Mexico',
        city: 'CDMX',
        interestedIn: 'Men, Women',
        relationshipStatus: 'Open',
        bodyType: 'Curvy',
        languages: ['Spanish', 'English'],
        categories: ['girls', 'vip'],
        subcategories: ['afterhours', 'fetish', 'private-shows'],
        instagramUrl: 'https://instagram.com/jade.demo',
        xUrl: 'https://x.com/jade_demo',
        websiteUrl: 'https://naughtybox.local/jade',
      },
      {
        email: 'maya@naughtybox.local',
        username: 'mayacosta',
        password: 'demo-disabled-login',
        displayName: 'Maya Costa',
        slug: 'maya-costa-live',
        title: 'Maya Costa Live',
        description: 'Contenido chill, viajes y directos diarios.',
        tags: ['girls', 'beach', 'public'],
        coverImageUrl: 'linear-gradient(135deg, rgba(21,159,149,0.28), rgba(255,213,176,0.18), rgba(7,18,20,0.94))',
        accentColor: '#159f95',
        age: 23,
        gender: 'woman',
        country: 'Spain',
        city: 'Malaga',
        interestedIn: 'Men, Women',
        relationshipStatus: 'Single',
        bodyType: 'Slim',
        languages: ['Spanish', 'English'],
        categories: ['girls', 'solo'],
        subcategories: ['beach', 'travel', 'chat'],
        instagramUrl: 'https://instagram.com/maya.demo',
        xUrl: 'https://x.com/maya_demo',
        websiteUrl: 'https://naughtybox.local/maya',
      },
      {
        email: 'sofia@naughtybox.local',
        username: 'sofiavelvet',
        password: 'demo-disabled-login',
        displayName: 'Sofia Velvet',
        slug: 'sofia-velvet-room',
        title: 'Sofia Velvet Room',
        description: 'Sala elegante orientada a fans premium y contenido exclusivo.',
        tags: ['girls', 'vip', 'premium'],
        coverImageUrl: 'linear-gradient(135deg, rgba(255,138,61,0.22), rgba(21,159,149,0.14), rgba(7,18,20,0.94))',
        accentColor: '#ff8a3d',
        age: 28,
        gender: 'woman',
        country: 'Argentina',
        city: 'Cordoba',
        interestedIn: 'Men, Women',
        relationshipStatus: 'Open',
        bodyType: 'Curvy',
        languages: ['Spanish'],
        categories: ['girls', 'vip'],
        subcategories: ['premium', 'lingerie', 'private-shows'],
        instagramUrl: 'https://instagram.com/sofia.demo',
        xUrl: 'https://x.com/sofia_demo',
        websiteUrl: 'https://naughtybox.local/sofia',
      },
      {
        email: 'alex@naughtybox.local',
        username: 'alexnero',
        password: 'demo-disabled-login',
        displayName: 'Alex Nero',
        slug: 'alex-nero-live',
        title: 'Alex Nero Live',
        description: 'Directo masculino orientado a publico mixto y shows privados.',
        tags: ['boys', 'solo', 'private-shows'],
        coverImageUrl: 'linear-gradient(135deg, rgba(21,159,149,0.30), rgba(255,138,61,0.14), rgba(7,18,20,0.94))',
        accentColor: '#159f95',
        age: 29,
        gender: 'man',
        country: 'Spain',
        city: 'Barcelona',
        interestedIn: 'Women, Men, Couples',
        relationshipStatus: 'Open',
        bodyType: 'Athletic',
        languages: ['Spanish', 'English'],
        categories: ['boys', 'solo'],
        subcategories: ['fitness', 'chat', 'private-shows'],
        instagramUrl: 'https://instagram.com/alex.demo',
        xUrl: 'https://x.com/alex_demo',
        websiteUrl: 'https://naughtybox.local/alex',
      },
      {
        email: 'marco@naughtybox.local',
        username: 'marcoblaze',
        password: 'demo-disabled-login',
        displayName: 'Marco Blaze',
        slug: 'marco-blaze-room',
        title: 'Marco Blaze Room',
        description: 'Room masculina enfocada en energia, juegos y comunidad.',
        tags: ['boys', 'new', 'public'],
        coverImageUrl: 'linear-gradient(135deg, rgba(255,138,61,0.24), rgba(21,159,149,0.14), rgba(7,18,20,0.94))',
        accentColor: '#ff8a3d',
        age: 27,
        gender: 'man',
        country: 'Italy',
        city: 'Milan',
        interestedIn: 'Women, Men',
        relationshipStatus: 'Single',
        bodyType: 'Athletic',
        languages: ['Spanish', 'Italian', 'English'],
        categories: ['boys', 'solo'],
        subcategories: ['new', 'games', 'public'],
        instagramUrl: 'https://instagram.com/marco.demo',
        xUrl: 'https://x.com/marco_demo',
        websiteUrl: 'https://naughtybox.local/marco',
      },
      {
        email: 'diego@naughtybox.local',
        username: 'diegowave',
        password: 'demo-disabled-login',
        displayName: 'Diego Wave',
        slug: 'diego-wave-live',
        title: 'Diego Wave Live',
        description: 'Streaming masculino con chat cercano, bromas y privados.',
        tags: ['boys', 'chat', 'vip'],
        coverImageUrl: 'linear-gradient(135deg, rgba(21,159,149,0.26), rgba(255,213,176,0.14), rgba(7,18,20,0.94))',
        accentColor: '#159f95',
        age: 30,
        gender: 'man',
        country: 'Mexico',
        city: 'Guadalajara',
        interestedIn: 'Women, Men, Couples',
        relationshipStatus: 'Open',
        bodyType: 'Athletic',
        languages: ['Spanish'],
        categories: ['boys', 'solo'],
        subcategories: ['vip', 'chat', 'private-shows'],
        instagramUrl: 'https://instagram.com/diego.demo',
        xUrl: 'https://x.com/diego_demo',
        websiteUrl: 'https://naughtybox.local/diego',
      },
      {
        email: 'alma.noah@naughtybox.local',
        username: 'almanoah',
        password: 'demo-disabled-login',
        displayName: 'Alma & Noah',
        slug: 'alma-noah-duo',
        title: 'Alma & Noah Duo',
        description: 'Pareja mixta con directos privados, juegos y metas por tokens.',
        tags: ['couples', 'vip', 'tokens'],
        coverImageUrl: 'linear-gradient(135deg, rgba(255,138,61,0.28), rgba(21,159,149,0.16), rgba(7,18,20,0.94))',
        accentColor: '#ff8a3d',
        age: 26,
        gender: 'couple-mf',
        country: 'Spain',
        city: 'Seville',
        interestedIn: 'Men, Women, Couples',
        relationshipStatus: 'Couple',
        bodyType: 'Fit',
        languages: ['Spanish', 'English'],
        categories: ['couples'],
        subcategories: ['private-shows', 'games', 'toys'],
        instagramUrl: 'https://instagram.com/almanoah.demo',
        xUrl: 'https://x.com/almanoah_demo',
        websiteUrl: 'https://naughtybox.local/alma-noah',
      },
      {
        email: 'leo.iris@naughtybox.local',
        username: 'leoiris',
        password: 'demo-disabled-login',
        displayName: 'Leo & Iris',
        slug: 'leo-iris-duo',
        title: 'Leo & Iris Duo',
        description: 'Pareja con contenido premium, subs y shows privados.',
        tags: ['couples', 'premium', 'private-shows'],
        coverImageUrl: 'linear-gradient(135deg, rgba(21,159,149,0.24), rgba(255,138,61,0.18), rgba(7,18,20,0.94))',
        accentColor: '#159f95',
        age: 24,
        gender: 'couple-mm',
        country: 'Portugal',
        city: 'Lisbon',
        interestedIn: 'Men, Women, Couples',
        relationshipStatus: 'Couple',
        bodyType: 'Fit',
        languages: ['Spanish', 'Portuguese', 'English'],
        categories: ['couples'],
        subcategories: ['premium', 'travel', 'private-shows'],
        instagramUrl: 'https://instagram.com/leoiris.demo',
        xUrl: 'https://x.com/leoiris_demo',
        websiteUrl: 'https://naughtybox.local/leo-iris',
      },
    ] as const;

    await this.query(
      `DELETE FROM users
       WHERE role = 'creator'
         AND email LIKE '%@naughtybox.local'
         AND username NOT IN (${localCreators.map((_, index) => `$${index + 1}`).join(', ')})`,
      localCreators.map((creator) => creator.username),
    );

    await this.ensureDemoViewer();

    for (const creator of localCreators) {
      const userId = await this.ensureUser({
        email: creator.email,
        username: creator.username,
        password: creator.password,
        role: 'creator',
      });
      const profileId = await this.ensureCreatorProfile(userId, creator);
      await this.ensureCreatorRoom(profileId, creator);
      await this.ensureWallet(userId);
    }

    const providers = [
      ['ccbill', 'researching', 'Adult-friendly processor candidate for cards.'],
      ['segpay', 'researching', 'Adult-friendly processor candidate for recurring billing.'],
      ['crypto', 'planned', 'Optional crypto rail for later token top-ups and payouts.'],
    ] as const;

    for (const [providerKey, status, notes] of providers) {
      await this.query(
        `INSERT INTO payment_provider_configs (id, provider_key, status, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (provider_key)
         DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()`,
        [randomUUID(), providerKey, status, notes],
      );
    }

    this.logger.log('Demo data synced.');
  }

  private async ensureDemoViewer() {
    const viewerId = await this.ensureUser({
      email: 'demo.viewer.20260321@naughtybox.local',
      username: 'demoviewer',
      password: 'Naughtybox123!',
      role: 'viewer',
    });
    await this.ensureWallet(viewerId, 250);
  }

  private async ensureUser(input: { email: string; username: string; password: string; role: 'viewer' | 'creator' }) {
    const existing = await this.query<{ id: string }>(
      `SELECT id FROM users WHERE username = $1 LIMIT 1`,
      [input.username],
    );

    if (existing.rows[0]) {
      await this.query(
        `UPDATE users
         SET email = $2, role = $3
         WHERE username = $1`,
        [input.username, input.email, input.role],
      );
      return existing.rows[0].id;
    }

    const id = randomUUID();
    await this.query(
      `INSERT INTO users (id, email, username, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, input.email, input.username, this.hashPassword(input.password), input.role],
    );
    return id;
  }

  private async ensureCreatorProfile(userId: string, creator: any) {
    const existing = await this.query<{ id: string }>(
      `SELECT id FROM creator_profiles WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    const id = existing.rows[0]?.id ?? randomUUID();

    await this.query(
      `INSERT INTO creator_profiles (
         id, user_id, display_name, slug, bio, avatar_url, cover_image_url, accent_color, tags,
         age, gender, country, city, interested_in, relationship_status, body_type,
         languages, categories, subcategories, instagram_url, x_url, website_url
       )
       VALUES (
         $1, $2, $3, $4, $5, NULL, $6, $7, $8,
         $9, $10, $11, $12, $13, $14, $15,
         $16, $17, $18, $19, $20, $21
       )
       ON CONFLICT (user_id)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         slug = EXCLUDED.slug,
         bio = EXCLUDED.bio,
         cover_image_url = EXCLUDED.cover_image_url,
         accent_color = EXCLUDED.accent_color,
         tags = EXCLUDED.tags,
         age = EXCLUDED.age,
         gender = EXCLUDED.gender,
         country = EXCLUDED.country,
         city = EXCLUDED.city,
         interested_in = EXCLUDED.interested_in,
         relationship_status = EXCLUDED.relationship_status,
         body_type = EXCLUDED.body_type,
         languages = EXCLUDED.languages,
         categories = EXCLUDED.categories,
         subcategories = EXCLUDED.subcategories,
         instagram_url = EXCLUDED.instagram_url,
         x_url = EXCLUDED.x_url,
         website_url = EXCLUDED.website_url,
         updated_at = NOW()`,
      [
        id,
        userId,
        creator.displayName,
        creator.slug,
        `${creator.displayName} es un perfil demo pensado para validar categorias, perfiles y discovery real del lobby.`,
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

    return id;
  }

  private async ensureCreatorRoom(profileId: string, creator: any) {
    await this.query(
      `INSERT INTO creator_rooms (id, creator_profile_id, slug, title, description, tags, stream_key, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       ON CONFLICT (creator_profile_id)
       DO UPDATE SET
         slug = EXCLUDED.slug,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         tags = EXCLUDED.tags,
         stream_key = EXCLUDED.stream_key,
         is_public = TRUE,
         updated_at = NOW()`,
      [randomUUID(), profileId, creator.slug, creator.title, creator.description, creator.tags, creator.slug],
    );
  }

  private async ensureWallet(userId: string, balance = 0) {
    await this.query(
      `INSERT INTO token_wallets (id, user_id, balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO NOTHING`,
      [randomUUID(), userId, balance],
    );

    const transactions = await this.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM token_transactions WHERE user_id = $1`,
      [userId],
    );

    if (Number(transactions.rows[0]?.count ?? 0) === 0) {
      await this.query(
        `INSERT INTO token_transactions (id, user_id, room_slug, type, amount, balance_after, description)
         VALUES ($1, $2, NULL, 'credit', $3, $3, 'Initial wallet seed')`,
        [randomUUID(), userId, balance],
      );
    }
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }
}
