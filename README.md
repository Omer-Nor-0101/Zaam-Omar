# Omar & Zaam

A one-page love-story website: Home, Photos, Videos, Our Story, Places, Future Dreams, Letters and Surprises are all sections of `index.html`, joined by one scroll. The top bar always stays on screen and its links jump to each section. Plain HTML, CSS and JavaScript, no build step.

The old addresses (`photos.html`, `videos.html`, ...) are tiny redirects to the matching section. Each section's own script lives in `js/pages/`, `js/dreams/` and `js/letters/`; `FU.scope(...)` in `common.js` keeps each section's script inside its own section.

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Live ticking counter (years to seconds), totals, recent photos and videos |
| Photos | `photos.html` | Categories, search, filter, sort, pagination, lightbox, add your own photos |
| Videos | `videos.html` | Categories, search, filter, sort, pagination, featured video, player dialog |
| Our Story | `story.html` | Two-sided timeline with icons, filter, add and edit milestones |
| Places | `places.html` | Real world map (OpenStreetMap), search for real places, filters, detail panel |
| Future Dreams | `dreams.html` | Bucket list with filters, progress and next trip |
| Letters | `letters.html` | Love letters with search, categories and a reading view |

```
forever-us/
  index.html photos.html videos.html story.html places.html dreams.html letters.html
  css/   base.css (theme + shared parts)  pages.css  dreams.css  letters.css
  js/    common.js (nav, Login, counter, toast)  hero-art.js  seeds.js (example content)  scenes-extra.js
         pages/    home.js photos.js videos.js story.js places.js
         dreams/   scenes.js hero.js data.js app.js
         letters/  scenes.js hero.js data.js app.js
  assets/favicon.svg
```

Open `index.html` in a browser; the nav links the pages together.

- Fonts (Playfair Display, Dancing Script, Poppins) load from Google Fonts and fall back to system fonts offline.
- Everything you add is saved in the browser (localStorage), separately on each device.
- Login only saves a display name on this device. It is a greeting, not a secure account.
- Photos are resized to about 1000px before saving. Video files (up to 150 MB) are uploaded to the server and kept in the database, so they never disappear.
- Entries marked "Example" or "Sample" are placeholders. Edit or delete them.
- Set your real start date with "Set our date" on Home or Our Story. Until then the counters use an example date.

## Login and Register (login.html)

Nobody can open the pages without logging in: every page sends you to `login.html` until you register or log in with a Gmail or a username and a password (6+ characters). Accounts, including the salted-and-hashed password, are saved in this browser only, so register once per device. This is not a secure server login: anyone who can open the site files can still read them, so do not reuse a password from another site. "Sign out" is under the Hi, name button in the top bar.

## Who published what

Everything you add (photos, videos, places, milestones, dreams, letters) is stamped "Published by <name>" using the logged-in account, and shows that badge on its card. Home has a "Latest Published" list with an Everyone / Omar / Zaam filter. This works for accounts that share one browser. Seeing each other's posts from two different phones or computers needs an online database, which a plain HTML site does not have.

## Surprises (surprises.html)

Add birthdays, other special days, and "Our Anniversary" (it uses the date set with "Set our date"). Each has a message from you, or press "Write one for me" (romantic, sweet or poetic). When the day arrives and someone logged in opens any page, a gift-opening screen shows the message with falling hearts, once per day. Use Preview any time. The site cannot send anything while it is closed; there is no email or push message without a server.

## Who can change what

Whatever one person publishes (photo, video, place, milestone, dream, letter, surprise) can only be edited or deleted by the account that published it. The other person can still open it, read it and press Favorite, but Save and Delete are hidden and the fields are locked. Sample entries have no owner, so anyone can edit them. This is a courtesy lock inside the page, not real security: both accounts share one browser's storage, so someone who knows how to use the browser's developer tools could still change the data. Real protection needs an online database with rules.

Register with a username, a Gmail, or both. Log in with either one. The Gmail is not verified: the site cannot send a confirmation code, so it only works as a name for the account.

## Magic

- Sparkle trail and tap hearts everywhere (button with the sparkle icon, bottom right, turns it on or off; off by default if the device asks for reduced motion).
- "Our music": the music-note button opens a small player. "Our song" is a soft melody made in the browser. "+ Add my music" lets you add your own audio files (MP3, M4A, WAV...). They play one after another, are saved on this device only, and only the person who added a song can remove it. Browsers only allow sound after a tap, so nothing starts by itself.
- Home: Love note of the day (a new sweet note each day) and the Magic date ball (tap for a date idea).
- Day milestones: when the days together reach 100, 200, 300... or a full year, the gift-opening screen appears by itself with a message (needs "Set our date" to be your real date).

## Profile

The top-right button shows your profile photo (or your first letter), your name and a blue dot meaning you are active. Click it to change or remove the photo. The photo is shrunk to a small square and saved in this browser only.

## Login look

The login page is a night scene by a lake with a couple under the moon, fireflies and a soft parallax when you move the mouse. "Use our photo as background" (bottom right) replaces the scene with your own photo, saved in this browser only; "Back to the night scene" restores it.

## Profile card

Click your photo and name at the top right to open a profile card with a large photo and a blue "Active now" dot, your name and username, your days together, how many things you published and when you joined. You can change or remove the photo, edit your name, and sign out. Home also greets you with your photo and name.

## Footer

Every page ends with a footer: a slowly scrolling strip of all page names, links to every page and to parts of Home, Photos and Special days, and social icons. The social icons start empty: click one (or "Edit social links") and paste your own profile address; Instagram, Facebook, WhatsApp (a phone number works), TikTok, YouTube, X and Telegram are supported. They are saved in this browser only. All in-page links scroll smoothly, and "Back to top" scrolls up smoothly.

## Backend (Node.js + SQL Server)

The site now saves everything in SQL Server, so you and your partner see the same photos, letters, dreams and so on from any phone or computer.

1. Install Node.js 18+ and make sure SQL Server accepts TCP/IP connections (SQL Server Configuration Manager > Network > TCP/IP enabled, port 1433) and that SQL authentication is on.
2. `cd server`, then `copy .env.example .env` (Windows) or `cp .env.example .env`, and fill in `DB_SERVER`, `DB_USER`, `DB_PASSWORD` and a long random `JWT_SECRET`.
3. `npm install`, then `npm start`. The database `ForeverUs` and its tables (`Users`, `AppData`) are created automatically (`server/schema.sql` shows them).
4. Open http://localhost:3000 and register. Only `MAX_USERS` accounts (default 2) can register, so strangers cannot create an account.

Notes: passwords are hashed with bcrypt on the server. Use HTTPS when you put it online (passwords travel to the server). When you come back to the tab, the page reloads by itself if your partner saved something new. If two people save the same list at the same moment, the last save wins. "Our music" files still live in each browser (IndexedDB) and are not sent to the server.

## Online for free (no need for your own PC): GitHub + Render + Neon

1. Neon (neon.tech): create a free project, copy the connection string (starts with `postgresql://`).
2. GitHub: create a new private repository and upload the contents of this folder (`render.yaml` must be at the top level; `.gitignore` keeps `.env` out).
3. Render (render.com): New > Blueprint, pick the repository, paste the Neon string as `DATABASE_URL`, click Apply.
4. Open the `onrender.com` link and register the two accounts right away (only `MAX_USERS` accounts can register).

When `DATABASE_URL` is set the server uses Postgres; without it, it uses SQL Server as described above.


## Videos, photos and files (up to 150 MB)

Videos (Videos section) and the photo or video of a dream (Future Dreams) are uploaded to the server and stored in the database (tables `Media` and `MediaChunks`), so they stay after reload and on every device. Limit: 150 MB per file. Uploads stream in 4 MB pieces, so the server does not need much memory, and videos can be skipped/seeked while playing. Free Neon gives about 0.5 GB in total, so a few big videos will fill it; upgrade the database or delete old files when it is full.

## Places are real

The Places section is a real map (OpenStreetMap through Leaflet). Press Add Place, search for the real cafe, beach or address (OpenStreetMap search), use "Use my location", or tap the exact spot on the map. A place cannot be saved without a real location. The old invented example places were removed; places saved before this update that have no real location show "needs a real location" until you press Edit place and search for them.

## Reset password

On the login page press "Forgot password?".
- **Secret code (works with no email):** set `RESET_CODE` (8+ characters) in `server/.env` (on Render it is generated for you: Environment tab). Press "I have a reset code", type your username/Gmail, the code and a new password.
- **Email link:** fill the `SMTP_*` settings in `server/.env` (Gmail needs an App password) and run `npm install` once. The link is valid for 30 minutes and only works once.
After changing `.env`, restart the server. Run `npm install` after this update (it adds `nodemailer`).
