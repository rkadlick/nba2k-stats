-- Add prompt_version column to ai_generation_logs.
-- The version is embedded as a "<!-- prompt_version: N -->" comment on the
-- first line of SYSTEM_PROMPT in lib/generateHeadline.ts and parsed out at
-- request time, so the prompt text itself is the single source of truth —
-- bump the comment whenever SYSTEM_PROMPT changes.
-- Run in Supabase SQL Editor after add_ai_generation_logs.sql

alter table ai_generation_logs
  add column if not exists prompt_version text;
