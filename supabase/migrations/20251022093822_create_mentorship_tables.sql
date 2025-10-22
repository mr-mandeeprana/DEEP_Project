-- Create mentors table
create table public.mentors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  title text not null,
  avatar text,
  specialties text[] default '{}' not null,
  rating decimal(3,2) default 0,
  total_sessions integer default 0,
  hourly_rate integer not null,
  languages text[] default '{}' not null,
  experience text not null,
  bio text,
  is_online boolean default false,
  verified boolean default false,
  availability jsonb default '{}' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create sessions table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  mentor_id uuid references public.mentors(id) on delete cascade not null,
  learner_id uuid references auth.users(id) on delete cascade not null,
  mentor_name text not null,
  learner_name text not null,
  date timestamp with time zone not null,
  duration integer not null, -- in minutes
  topic text not null,
  status text not null check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  price decimal(10,2) not null,
  rating integer check (rating >= 1 and rating <= 5),
  feedback text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create bookings table (for pending bookings before payment)
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  mentor_id uuid references public.mentors(id) on delete cascade not null,
  learner_id uuid references auth.users(id) on delete cascade not null,
  mentor_name text not null,
  learner_name text not null,
  date timestamp with time zone not null,
  duration integer not null, -- in minutes
  topic text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index mentors_user_id_idx on public.mentors(user_id);
create index mentors_verified_idx on public.mentors(verified);
create index mentors_is_online_idx on public.mentors(is_online);
create index sessions_mentor_id_idx on public.sessions(mentor_id);
create index sessions_learner_id_idx on public.sessions(learner_id);
create index sessions_status_idx on public.sessions(status);
create index sessions_date_idx on public.sessions(date);
create index bookings_mentor_id_idx on public.bookings(mentor_id);
create index bookings_learner_id_idx on public.bookings(learner_id);
create index bookings_status_idx on public.bookings(status);
create index bookings_date_idx on public.bookings(date);

-- Enable Row Level Security (RLS)
alter table public.mentors enable row level security;
alter table public.sessions enable row level security;
alter table public.bookings enable row level security;

-- RLS Policies for mentors table
create policy "Mentors are viewable by everyone" on public.mentors
  for select using (true);

create policy "Mentors can be updated by their owners" on public.mentors
  for update using (auth.uid() = user_id);

create policy "Mentors can be inserted by authenticated users" on public.mentors
  for insert with check (auth.uid() = user_id);

-- RLS Policies for sessions table
create policy "Sessions are viewable by participants" on public.sessions
  for select using (auth.uid() = mentor_id or auth.uid() = learner_id);

create policy "Sessions can be updated by participants" on public.sessions
  for update using (auth.uid() = mentor_id or auth.uid() = learner_id);

create policy "Sessions can be inserted by authenticated users" on public.sessions
  for insert with check (auth.uid() = mentor_id or auth.uid() = learner_id);

-- RLS Policies for bookings table
create policy "Bookings are viewable by participants" on public.bookings
  for select using (auth.uid() = mentor_id or auth.uid() = learner_id);

create policy "Bookings can be updated by participants" on public.bookings
  for update using (auth.uid() = mentor_id or auth.uid() = learner_id);

create policy "Bookings can be inserted by authenticated users" on public.bookings
  for insert with check (auth.uid() = learner_id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.mentors
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.sessions
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.bookings
  for each row execute procedure public.handle_updated_at();

-- Function to update mentor stats after session completion
create or replace function public.update_mentor_stats()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update public.mentors
    set
      total_sessions = total_sessions + 1,
      rating = (
        select avg(r.rating)
        from public.sessions s
        where s.mentor_id = new.mentor_id and s.status = 'completed' and s.rating is not null
      )
    where id = new.mentor_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger update_mentor_stats after update on public.sessions
  for each row execute procedure public.update_mentor_stats();