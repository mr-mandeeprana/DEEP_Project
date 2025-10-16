-- Add foreign key constraints to establish proper relationships between tables

-- Add foreign key from community_posts.user_id to profiles.user_id
ALTER TABLE public.community_posts 
ADD CONSTRAINT fk_community_posts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key from post_comments.user_id to profiles.user_id
ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key from post_likes.user_id to profiles.user_id
ALTER TABLE public.post_likes 
ADD CONSTRAINT fk_post_likes_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key from personal_notes.user_id to profiles.user_id
ALTER TABLE public.personal_notes 
ADD CONSTRAINT fk_personal_notes_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key from post_comments.post_id to community_posts.id
ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_post_id 
FOREIGN KEY (post_id) REFERENCES public.community_posts(id) 
ON DELETE CASCADE;

-- Add foreign key from post_likes.post_id to community_posts.id  
ALTER TABLE public.post_likes 
ADD CONSTRAINT fk_post_likes_post_id 
FOREIGN KEY (post_id) REFERENCES public.community_posts(id) 
ON DELETE CASCADE;