-- Script de Configuração para o FinanSmart no Supabase

-- 1. Criar Tabela de Perfis (opcional, vinculado ao Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  value NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  recurrence TEXT DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Configurar Row Level Security (RLS)
-- Isso garante que cada usuário só acesse seus próprios dados
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para transações
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações" ON public.transactions;
CREATE POLICY "Usuários podem ver suas próprias transações" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias transações" ON public.transactions;
CREATE POLICY "Usuários podem inserir suas próprias transações" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias transações" ON public.transactions;
CREATE POLICY "Usuários podem atualizar suas próprias transações" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias transações" ON public.transactions;
CREATE POLICY "Usuários podem deletar suas próprias transações" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);
