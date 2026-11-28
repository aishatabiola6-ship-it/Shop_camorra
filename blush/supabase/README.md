# Blush on Supabase

Project: `cebqjhroazymavpaxbzp` (https://cebqjhroazymavpaxbzp.supabase.co, London)

## What lives where

| Table | What it holds | Who can see it |
|---|---|---|
| `orders` | Every order: customer, phone, address, items, totals, status | The customer who placed it (if signed in), and admins |
| `profiles` | Each account's name and saved delivery address | That customer, and admins |
| `products` | Price, sold-out flag and product details | Everyone reads; admins edit |
| `admins` | Account IDs allowed into `admin.html` | Nobody from the website |

Guests can place orders but can't read any. Rules are in `schema.sql` (row-level security).

## Files

- `schema.sql`: tables, security rules and the sign-up trigger. Safe to run again.
- `seed-products.sql`: loads `products.js` into the `products` table (re-running updates prices and details).
- `functions/reset-password/index.ts`: sets a new password after the Gmail script confirms the 6-digit reset code.

## Sign-in

Accounts use Supabase Auth (email + password). Blush still emails its own 6-digit codes through
`email/blush-email.gs`, so Supabase's own confirmation email is switched off ("auto-confirm").
Signing in needs the password and then the emailed code.

## Admin

`admin.html` (e.g. https://blush-site.pages.dev/admin.html): orders with status updates, and product
prices and sold-out. To add an admin, create an account on the shop, then run in the SQL editor:

    insert into public.admins (user_id) select id from auth.users where email = 'owner@example.com';

## Keys

The `anon` key in `index.html` and `admin.html` is public by design; the security rules protect the data.
Never put the `service_role` key in the website.
