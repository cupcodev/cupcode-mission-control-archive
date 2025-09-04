-- Add bio and avatar_url columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN bio TEXT,
ADD COLUMN avatar_url TEXT;