-- Add free_prompts column to profiles table
alter table public.profiles add column if not exists free_prompts integer default 3;

-- Create trigger to set default free prompts on new profile
create or replace function public.set_default_free_prompts()
returns trigger as $$
begin
  if new.free_prompts is null then
    new.free_prompts := 3;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_free_prompts_on_profile on public.profiles;
create trigger set_free_prompts_on_profile
  before insert on public.profiles
  for each row
  execute function public.set_default_free_prompts();

-- Initialize default courses
insert into public.courses (name, display_name, color, icon) values
  ('mechanical', 'Mechanical Engineering', '#FF6B35', '⚙️'),
  ('aerospace', 'Aerospace Engineering', '#004E89', '✈️'),
  ('civil', 'Civil Engineering', '#8B4513', '🏗️'),
  ('chemical', 'Chemical Engineering', '#FFB703', '⚗️'),
  ('cse', 'Computer Science & Engineering', '#1F77E1', '💻'),
  ('ece', 'Electronics & Communication', '#FF006E', '📡'),
  ('biotechnology', 'Biotechnology', '#06A77D', '🧬')
on conflict (name) do nothing;

-- Insert default subjects for Mechanical Engineering
insert into public.subjects (course_id, name, display_name, semester) 
select id, 'thermodynamics', 'Thermodynamics', 3
from public.courses where name = 'mechanical'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'mechanics', 'Mechanics of Materials', 2
from public.courses where name = 'mechanical'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'fluid_mechanics', 'Fluid Mechanics', 4
from public.courses where name = 'mechanical'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'heat_transfer', 'Heat Transfer', 4
from public.courses where name = 'mechanical'
on conflict (course_id, name) do nothing;

-- Insert default subjects for Aerospace Engineering
insert into public.subjects (course_id, name, display_name, semester)
select id, 'aerodynamics', 'Aerodynamics', 3
from public.courses where name = 'aerospace'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'propulsion', 'Propulsion Systems', 4
from public.courses where name = 'aerospace'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'flight_mechanics', 'Flight Mechanics', 5
from public.courses where name = 'aerospace'
on conflict (course_id, name) do nothing;

-- Insert default subjects for CSE
insert into public.subjects (course_id, name, display_name, semester)
select id, 'data_structures', 'Data Structures', 2
from public.courses where name = 'cse'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'algorithms', 'Algorithms', 3
from public.courses where name = 'cse'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'databases', 'Databases', 4
from public.courses where name = 'cse'
on conflict (course_id, name) do nothing;

-- Insert default subjects for ECE
insert into public.subjects (course_id, name, display_name, semester)
select id, 'circuits', 'Circuit Analysis', 2
from public.courses where name = 'ece'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'electromagnetics', 'Electromagnetics', 3
from public.courses where name = 'ece'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'signal_processing', 'Signal Processing', 4
from public.courses where name = 'ece'
on conflict (course_id, name) do nothing;

-- Insert default subjects for Civil Engineering
insert into public.subjects (course_id, name, display_name, semester)
select id, 'structural_analysis', 'Structural Analysis', 3
from public.courses where name = 'civil'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'geotechnics', 'Geotechnical Engineering', 4
from public.courses where name = 'civil'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'hydraulics', 'Hydraulics & Hydrology', 3
from public.courses where name = 'civil'
on conflict (course_id, name) do nothing;

-- Insert default subjects for Chemical Engineering
insert into public.subjects (course_id, name, display_name, semester)
select id, 'thermodynamics', 'Thermodynamics', 3
from public.courses where name = 'chemical'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'reaction_engineering', 'Reaction Engineering', 4
from public.courses where name = 'chemical'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'separation_processes', 'Separation Processes', 4
from public.courses where name = 'chemical'
on conflict (course_id, name) do nothing;

-- Insert default subjects for Biotechnology
insert into public.subjects (course_id, name, display_name, semester)
select id, 'molecular_biology', 'Molecular Biology', 2
from public.courses where name = 'biotechnology'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'bioprocess_engineering', 'Bioprocess Engineering', 4
from public.courses where name = 'biotechnology'
on conflict (course_id, name) do nothing;

insert into public.subjects (course_id, name, display_name, semester)
select id, 'bioinformatics', 'Bioinformatics', 5
from public.courses where name = 'biotechnology'
on conflict (course_id, name) do nothing;
