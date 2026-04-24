# BrainzAcademy

A full-stack edtech platform for Nigerian secondary school students preparing for WAEC, NECO, and JAMB examinations.

🌐 **Live:** [brainzacademy.com](https://brainzacademy.com)

---

## Features

**Student Portal**
- CBT exam engine with timed sessions and auto-submit
- Score analytics and weak topic insights
- Leaderboard and streak tracking
- Question bookmarks for revision
- AI-generated lesson notes (Claude API)
- Past papers browser with PDF embed
- Discussion and comments per question

**Teacher Portal**
- Test builder with manual and random question selection
- DOCX and CSV bulk question upload with image support
- Student performance dashboard
- Subscription and access management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django, Django REST Framework |
| Frontend | React, Vite |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | Cloudflare R2 |
| Email | Brevo |
| AI | Anthropic Claude API |
| Payments | Paystack |
| Infrastructure | Railway, GitHub Actions CI/CD |
| Domain | Namecheap |

---

## Architecture Highlights

- Subscription gate system with free tier limits controlled via admin panel — no redeploy needed
- "Generate once, cache on accept" pattern for AI lesson note generation to minimise API costs
- Unified DOCX parser handling paragraph-based, list-based, and mixed question formats via pandoc
- N+1 free results page using prefetch_related and select_related across all question relationships
- Paystack payment integration with webhook verification for subscription activation and recurring billing
- Soft-delete comment moderation with subscription-gated posting

---

## Local Development

```bash
git clone https://github.com/yourusername/brainzacademy.git
cd brainzacademy
pip install -r requirements.txt
cp .env.example .env   # fill in your values
python manage.py migrate
python manage.py runserver
```

---

## Licence

Private — all rights reserved.