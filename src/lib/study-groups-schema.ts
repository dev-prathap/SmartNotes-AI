// Study Groups Database Schema
import { query } from './database';

export async function createStudyGroupsTables(): Promise<void> {
  try {
    // Study groups table
    await query(`
      CREATE TABLE IF NOT EXISTS study_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        is_private BOOLEAN DEFAULT false,
        invite_code VARCHAR(20) UNIQUE,
        max_members INTEGER DEFAULT 50,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Study group members table
    await query(`
      CREATE TABLE IF NOT EXISTS study_group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `);

    // Group chat messages table
    await query(`
      CREATE TABLE IF NOT EXISTS group_chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'quiz', 'announcement')),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Shared documents in groups
    await query(`
      CREATE TABLE IF NOT EXISTS group_shared_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(group_id, document_id)
      )
    `);

    // Group quiz competitions
    await query(`
      CREATE TABLE IF NOT EXISTS group_quiz_competitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
        quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Group quiz competition participants
    await query(`
      CREATE TABLE IF NOT EXISTS group_quiz_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        competition_id UUID NOT NULL REFERENCES group_quiz_competitions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        time_taken_seconds INTEGER,
        completed_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(competition_id, user_id)
      )
    `);

    // Flashcards table
    await query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        front_text TEXT NOT NULL,
        back_text TEXT NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Flashcard decks table
    await query(`
      CREATE TABLE IF NOT EXISTS flashcard_decks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Flashcard deck items (many-to-many)
    await query(`
      CREATE TABLE IF NOT EXISTS flashcard_deck_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
        flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(deck_id, flashcard_id)
      )
    `);

    // Flashcard review history (spaced repetition)
    await query(`
      CREATE TABLE IF NOT EXISTS flashcard_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
        quality INTEGER NOT NULL CHECK (quality BETWEEN 0 AND 5),
        easiness_factor REAL DEFAULT 2.5,
        interval INTEGER DEFAULT 1,
        repetitions INTEGER DEFAULT 0,
        next_review_date TIMESTAMP WITH TIME ZONE,
        reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Document summaries table
    await query(`
      CREATE TABLE IF NOT EXISTS document_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        summary_type VARCHAR(20) DEFAULT 'medium' CHECK (summary_type IN ('short', 'medium', 'long', 'key_points')),
        summary_text TEXT NOT NULL,
        word_count INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(document_id, user_id, summary_type)
      )
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_study_groups_subject_id ON study_groups(subject_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON study_group_members(group_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON study_group_members(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_id ON group_chat_messages(group_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_group_shared_documents_group_id ON group_shared_documents(group_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_group_quiz_competitions_group_id ON group_quiz_competitions(group_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_flashcards_document_id ON flashcards(document_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON flashcard_decks(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON flashcard_reviews(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next_review ON flashcard_reviews(user_id, next_review_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_document_summaries_document_id ON document_summaries(document_id)`);

    // Add triggers for updated_at
    const tables = ['study_groups', 'flashcards', 'flashcard_decks'];
    for (const table of tables) {
      await query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    console.log('✅ Study groups, flashcards, and summaries tables created successfully');
  } catch (error) {
    console.error('❌ Error creating study groups tables:', error);
    throw error;
  }
}
