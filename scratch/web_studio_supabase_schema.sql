-- =====================================================================
-- FIVENEST WEB STUDIO - SUPABASE POSTGRESQL SCHEMA INITIALIZATION
-- =====================================================================
-- Run this script inside the Supabase SQL Editor to initialize all tables,
-- functions, triggers, and Row-Level Security (RLS) policies.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Allow users to read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PLANS TABLE (Subscription / Package plans)
create table public.plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price_inr numeric not null,
  credits_included numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.plans enable row level security;
create policy "Allow everyone to read plans" on public.plans for select using (true);


-- 3. WALLET TABLE (Caches the user's active token balance)
create table public.wallet (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  balance numeric default 0.00 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wallet enable row level security;

create policy "Allow users to read their own wallet"
  on public.wallet for select
  using (auth.uid() = user_id);


-- 4. WALLET TRANSACTIONS TABLE (Fiat currency transactions via Razorpay)
create table public.wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null, -- amount paid in INR
  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  status text not null check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wallet_transactions enable row level security;

create policy "Allow users to select their own wallet transactions"
  on public.wallet_transactions for select
  using (auth.uid() = user_id);


-- 5. CREDIT TRANSACTIONS TABLE (Token ledger logs)
create table public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null, -- positive for recharge, negative for deduction
  transaction_type text not null check (transaction_type in ('topup', 'deduction_export', 'refund', 'bonus')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.credit_transactions enable row level security;

create policy "Allow users to select their own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

create policy "Allow users to insert their own credit transactions"
  on public.credit_transactions for insert
  with check (auth.uid() = user_id);


-- 6. PLUGIN USAGE LOGS TABLE
create table public.plugin_usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plugin_type text not null, -- 'web', 'illustrator', 'corel'
  action text not null, -- 'export', 'nesting'
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.plugin_usage_logs enable row level security;

create policy "Allow users to insert their own logs"
  on public.plugin_usage_logs for insert
  with check (auth.uid() = user_id);

create policy "Allow users to select their own logs"
  on public.plugin_usage_logs for select
  using (auth.uid() = user_id);


-- 7. INVOICES TABLE
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  transaction_id uuid references public.wallet_transactions(id) on delete set null,
  invoice_number text not null unique,
  amount numeric not null,
  tax_inr numeric default 0.00,
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invoices enable row level security;

create policy "Allow users to view their own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);


-- 8. SUBSCRIPTIONS TABLE
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.plans(id) on delete restrict not null,
  status text not null check (status in ('active', 'inactive', 'cancelled', 'past_due')),
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscriptions enable row level security;

create policy "Allow users to view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);


-- =====================================================================
-- LEDGER DATABASE TRIGGERS & FUNCTIONS
-- =====================================================================

-- Trigger to auto-update wallet balance whenever a new credit transaction is added
create or replace function public.update_wallet_balance()
returns trigger as $$
begin
  insert into public.wallet (user_id, balance, updated_at)
  values (new.user_id, new.amount, now())
  on conflict (user_id)
  do update set 
    balance = public.wallet.balance + new.amount,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger tr_update_wallet_balance
  after insert on public.credit_transactions
  for each row execute procedure public.update_wallet_balance();


-- Function to safely deduct credits on export (prevents race conditions)
create or replace function public.deduct_export_credits(amount_to_deduct numeric, export_desc text)
returns boolean as $$
declare
  current_bal numeric;
begin
  -- Lock the wallet row to prevent parallel deductions (race conditions)
  select balance into current_bal from public.wallet where user_id = auth.uid() for update;
  
  if current_bal is null then
    return false;
  end if;
  
  if current_bal >= amount_to_deduct then
    -- Record credit transaction deduction, trigger will auto-update cached wallet balance
    insert into public.credit_transactions (user_id, amount, transaction_type, description)
    values (auth.uid(), -amount_to_deduct, 'deduction_export', export_desc);
    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;
