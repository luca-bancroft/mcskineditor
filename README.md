# Minecraft Skin Editor

A web-based Minecraft skin editor that lets you create, edit, and share custom Minecraft skins with a live 3D preview.  
As of now I am still maintaining and giving updates to the website whenever I have time.

Currently deployed at the domain https://mcskineditor.vercel.app/  

---

## Features

- **3D Skin Viewer** — live rotating preview with inner/outer layer toggles
- **2D Canvas Editor** — paint directly on the skin map with pixel-perfect tools
- **Drawing Tools** — pencil, eraser, eyedropper, and fill bucket
- **Skin Guide** — side-by-side UV reference map
- **Undo / Redo** — full edit history
- **Color History** — quick access to recently used colours
- **Upload & Download** — import any `.png` skin and export your work
- **Publish & Gallery** — share your skins with the community
- **Your Skins** — manage, load, and delete your saved skins
- **User Profiles** — public profile pages with published skin collections
- **Authentication** — sign in with GitHub or Google

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | CSS Modules |
| 3D Viewer | [skinview3d](https://github.com/bs-community/skinview3d) |
| Auth | [NextAuth.js](https://next-auth.js.org) |
| Database | [Supabase](https://supabase.com) (Postgres + Storage) |
| Font | [Hack](https://sourcefoundry.org/hack/) |
| Icons | [Font Awesome](https://fontawesome.com) |
| Deployment | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [GitHub OAuth App](https://github.com/settings/developers)
- A [Google OAuth App](https://console.cloud.google.com)

### Installation

```bash
git clone https://github.com/your-username/mcskineditor.git
cd mcskineditor
npm install
```

### Environment Variables

Create a `.env.local` file in the root of the project:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
create table skins (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  user_id_sanitized text,
  user_name text not null,
  user_avatar text,
  title text not null,
  image_url text not null,
  published boolean default false,
  likes_count integer default 0,
  created_at timestamp with time zone default now()
);

create table likes (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  skin_id uuid not null references skins(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, skin_id)
);

create table profiles (
  id text primary key,
  user_name text not null,
  user_avatar text,
  updated_at timestamp with time zone default now()
);
```

Create a public storage bucket named `skins` in Supabase Storage.

---

## License

MIT — feel free to use, modify, and distribute this project. I made this so i'd have something cool to show off to friends.

---

<p align="center">Built by <a href="https://github.com/luca-bancroft">Luca Bancroft</a></p>
