-- Create tables based on the schema

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuario_rol table
CREATE TABLE public.usuario_rol (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rol VARCHAR NOT NULL CHECK (rol IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suggestions table
CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open'   CHECK (status IN ('open', 'in_progress', 'resolved')),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_comments_ticket_id ON public.comments(ticket_id);
CREATE INDEX idx_usuario_rol_user_id ON public.usuario_rol(user_id);
CREATE INDEX idx_tickets_submitted_by ON public.tickets(submitted_by);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);

-- Set up RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_rol
    WHERE user_id = $1 AND rol = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies
-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

  -- Permitir a cualquier usuario autenticado ver el nombre de cualquier perfil
CREATE POLICY "Authenticated users can view full_name of any profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Usuario_rol policies
CREATE POLICY "Admins can manage roles"
  ON public.usuario_rol FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own role"
  ON public.usuario_rol FOR SELECT
  USING (auth.uid() = user_id);

-- Tickets policies
CREATE POLICY "Users can view all tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update tickets they submitted"
  ON public.tickets FOR UPDATE
  USING (auth.uid() = submitted_by);

CREATE POLICY "Admins can update any ticket"
  ON public.tickets FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Comments policies
CREATE POLICY "Users can view all comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any comment"
  ON public.comments FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Create triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_usuario_rol_updated_at
BEFORE UPDATE ON public.usuario_rol
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Auto-populate user_name in comments from profiles
CREATE OR REPLACE FUNCTION public.set_comment_user_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_name = (SELECT full_name FROM public.profiles WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_comment_user_name_trigger
BEFORE INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.set_comment_user_name();

-- Automatically create a default 'user' role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user using the display name from metadata
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Add default role 'user'
  INSERT INTO public.usuario_rol (user_id, rol)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user deletion (clean up related data)
CREATE OR REPLACE FUNCTION public.delete_user_with_related_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Eliminar comentarios del usuario
    DELETE FROM public.comments WHERE user_id = p_user_id;
    
    -- Actualizar tickets donde el usuario es el asignado (assigned_to)
    UPDATE public.tickets SET assigned_to = NULL WHERE assigned_to = p_user_id;
    
    -- Eliminar tickets donde el usuario es el creador (submitted_by)
    -- Esto también eliminará automáticamente los comentarios relacionados debido a la restricción ON DELETE CASCADE
    DELETE FROM public.tickets WHERE submitted_by = p_user_id;
    
    -- Eliminar roles del usuario
    DELETE FROM public.usuario_rol WHERE user_id = p_user_id;
    
    -- Eliminar perfil del usuario
    DELETE FROM public.profiles WHERE id = p_user_id;
    
    -- No eliminamos directamente el usuario de auth.users, ya que eso lo hace Supabase
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to auth schema (requires special permissions)
-- Supabase may need to run this part separately with admin privileges
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();