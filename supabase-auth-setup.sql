-- Enable Row Level Security (RLS) on tests table
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Add user_id column if it doesn't exist
ALTER TABLE tests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for tests table
-- Users can only see their own tests
CREATE POLICY "Users can view own tests" ON tests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own tests
CREATE POLICY "Users can insert own tests" ON tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tests
CREATE POLICY "Users can update own tests" ON tests
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own tests
CREATE POLICY "Users can delete own tests" ON tests
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on other user-specific tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Add user_id to user_preferences if not exists
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Add user_id to user_tips if not exists
ALTER TABLE user_tips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for user_tips
CREATE POLICY "Users can view own tips" ON user_tips
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tips" ON user_tips
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tips" ON user_tips
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tips" ON user_tips
  FOR DELETE USING (auth.uid() = user_id);

-- Add user_id to user_achievements if not exists
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Add user_id to sessions if not exists
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);
