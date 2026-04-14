

# Gmail Transaction Auto-Import — Plan

## What We're Building

An integration that connects to your Gmail account, reads bank/payment notification emails, extracts transaction details (amount, description, date, type), and automatically records them in your transactions table.

## How It Works

```text
Gmail Inbox (bank notifications, receipts)
       │
       ▼
Edge Function: "sync-gmail-transactions"
  - Authenticates with Gmail API using your OAuth token
  - Searches for emails matching bank/payment patterns
  - Parses amount, description, date from email body/subject
  - Uses Lovable AI (Gemini) to intelligently extract transaction data
  - Inserts new transactions into the database
  - Tracks last-synced email to avoid duplicates
       │
       ▼
Transactions appear in your app automatically
```

## Architecture

### 1. Google OAuth Setup (User Action Required)
- You'll need to create a Google Cloud project and enable the Gmail API
- Create OAuth 2.0 credentials (Client ID + Secret)
- The app will have a "Connect Gmail" button in Settings that initiates the OAuth flow
- Your Gmail access token and refresh token will be stored securely

### 2. New Database Table: `gmail_sync_config`
- Stores: `user_id`, `access_token` (encrypted), `refresh_token`, `last_sync_at`, `email_filters` (e.g., sender patterns like "noreply@bank.com"), `is_active`

### 3. Edge Function: `sync-gmail-transactions`
- Fetches unread/new emails since last sync matching configured filters
- Sends email content to Gemini AI to extract structured transaction data (amount, category, description, date, income/expense)
- Creates transaction records in the database
- Can be triggered manually ("Sync Now" button) or on a schedule

### 4. Settings Page Updates
- "Connect Gmail" button with OAuth flow
- Email filter configuration (which sender emails to watch, e.g., "alerts@mybank.com")
- "Sync Now" button to manually trigger import
- Sync history/log showing what was imported

### 5. AI-Powered Parsing
Uses Gemini to parse bank emails intelligently — handles different bank formats, languages (English/Arabic), and extracts:
- Transaction amount
- Type (income/expense)
- Category (auto-detected)
- Description
- Date

## Important Limitation

There is no built-in Gmail connector available, so you'll need to create Google Cloud OAuth credentials. I'll guide you through the setup step by step — it takes about 5 minutes.

## Implementation Steps

1. Create `gmail_sync_config` table with RLS policies
2. Build the `sync-gmail-transactions` edge function with Gmail API + AI parsing
3. Add Google OAuth flow for Gmail access in the Settings page
4. Add "Connect Gmail" UI, email filter config, and "Sync Now" button to Settings
5. Add i18n translations for all new Gmail-related strings (English + Arabic)

## Files to Create/Modify
- **Migration**: New `gmail_sync_config` table
- **`supabase/functions/sync-gmail-transactions/index.ts`**: Gmail API + AI parsing edge function
- **`src/pages/Settings.tsx`**: Gmail connection UI, filters, sync button
- **`src/lib/i18n.ts`**: New translation keys

