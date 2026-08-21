# Anteneh Book Store — Manual Free Website

Hand-coded static storefront using HTML, CSS and vanilla JavaScript.

## Configure
Edit `config.js` and set your Supabase publishable/anon key and public Telegram username. Never put the Supabase service_role key in a browser website.

## Supabase
The site reads intended public catalogue fields from `products`. RLS must expose only the catalogue data meant for public viewing. Keep Telegram session/admin tables private.

## Free deployment
Cloudflare Pages can deploy this static site for free. Connect this GitHub repository to Cloudflare Pages; for plain HTML, no build framework is required.

## Architecture
Website = storefront. Supabase = catalogue/backend. Telegram = purchase approval and protected delivery. Do not host protected PDFs publicly from this site.
