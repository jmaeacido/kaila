# KAILA

KAILA is a local services marketplace concept for helping clients find trusted local service providers while helping skilled workers become more visible.

This repository contains the KAILA founder-grade planning package: business proposal, validation plan, operational playbooks, MVP specification, pitch material, financial model, and field forms.

## Mobile-First MVP

The first KAILA web app version is available at the repository root:

- `index.html` - mobile-first MVP interface
- `style.css` - responsive app styling
- `app.js` - SweetAlert2-powered auth, role-based flows, pilot board, and real-time events
- `socket/` - KAILA-owned Socket.IO server

Current MVP screens:

- Landing page
- Username-based registration for Client and Provider roles
- Login page
- Authenticated compact dashboard

Real-time MVP events:

- Job request created
- Offer sent
- Counter-offer sent
- Job confirmed
- Job started
- Provider marked job done with proof notes
- Optional request and completion photo/video attachments: JPG, PNG, WebP, MP4, or WebM; up to 3 files per stage and 10 MB per file
- Client confirmed completion
- Confirmed-job messaging with live updates, typing indicators, room presence, reactions, and archived read-only transcripts
- Payment released independent of ratings
- Client requested revision/correction
- Client rated provider
- Provider rated client
- Blind mutual ratings revealed after both sides rate or rating window expires
- Job cancelled
- Job disputed
- Admin resolved dispute
- Provider profile saved
- Team activity note

Run the web app locally:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`.

Run KAILA's MySQL-backed API/socket:

```bash
cd socket
npm install
npm start
```

Default socket URL: `http://<same-host-as-the-web-app>:6002`

For example, if the app is opened from another device at `http://crg-co1-23-0028/kaila/`, the browser connects to `http://crg-co1-23-0028:6002`.

For deployment:

- Serve the root folder as a static site.
- Run `socket/` as a Node service.
- Run MySQL and configure `socket/.env`.
- Set `KAILA_SOCKET_BEARER_TOKEN` in `socket/.env`.
- Update the socket URL in the app if the deployed socket URL changes.

Default local MySQL settings:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kaila_mvp
```

The Node service creates the `kaila_mvp` database and required tables automatically.

## Package Contents

All documents are inside `KAILA_Founder_Grade_Package/`.

| File | Purpose |
| --- | --- |
| `00 READ ME KAILA Founder Package.pdf` | Package index, usage guide, and recommended reading order. |
| `01 Master Business Proposal.pdf` | Full business case, problem, market, model, strategy, risks, roadmap, TOC, and terms. |
| `01 Master Business Proposal.docx` | Editable Word version of the master business proposal. |
| `02 Business Model Canvas and Lean Canvas.pdf` | Business Model Canvas and Lean Canvas in structured table format. |
| `03 Market Validation and Feasibility Study.pdf` | Research plan, interview guide, pilot design, go/no-go criteria, TOC, and terms. |
| `04 Provider Recruitment and Operations Playbook.pdf` | Provider recruitment, onboarding, operations, dispute handling, and recruitment targets. |
| `05 MVP Functional Specification.pdf` | MVP scope, user roles, flows, modules, status model, and database concept. |
| `06 Investor Style Pitch Deck.pdf` | Slide-style summary for early founder or investor discussions. |
| `07 Founders Agreement Discussion Draft.pdf` | Non-legal discussion draft for founder roles, ownership, contributions, and governance. |
| `08_Three_Year_Financial_Projection.xlsx` | Editable financial assumptions, projections, annual summary, unit economics, and terms. |
| `09 Field Forms Pack.pdf` | Printable/copyable forms for client surveys, provider signup, interviews, job logs, and meeting notes. |
| `KAILA Business Plan.pdf` | Concise founder and co-founder business plan. |
| `KAILA Founder Presentation/` | Online HTML slideshow and downloadable PowerPoint covering files `01` through `09`. |

## Recommended Reading Order

1. `00 READ ME KAILA Founder Package.pdf`
2. `01 Master Business Proposal.pdf`
3. `02 Business Model Canvas and Lean Canvas.pdf`
4. `03 Market Validation and Feasibility Study.pdf`
5. `04 Provider Recruitment and Operations Playbook.pdf`
6. `05 MVP Functional Specification.pdf`
7. `08_Three_Year_Financial_Projection.xlsx`
8. Remaining supporting documents as needed

## Notes

- Several PDFs include a `Definition of Terms` section for shared vocabulary.
- Longer PDFs include a formal cover page and Table of Contents.
- The `KAILA Founder Presentation/` folder can be opened locally through `index.html`; it also includes a downloadable `.pptx` version.
- The financial projection is an editable planning model, not a promise of results.
- The founders agreement draft is for discussion only and is not legal advice.
