-- Run this in Supabase SQL Editor to add photo and reputation support

-- Add device_id column to track reporters
ALTER TABLE reports ADD COLUMN IF NOT EXISTS device_id text;

-- Add photo_url column for photo evidence
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_url text;

-- Create index for device reputation lookups
CREATE INDEX IF NOT EXISTS idx_reports_device ON reports (device_id);

-- Enable Supabase Storage bucket for photos (do this manually in Storage tab)
-- Bucket name: report-photos
-- Public: true
