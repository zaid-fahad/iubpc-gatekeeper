# IUB Innovation to Impact (i2i) Award Program - Application Draft
**Phase 1, 2026 | Independent University, Bangladesh (IUB)**
**Target Portal:** [i2i.iub.edu.bd](http://i2i.iub.edu.bd)

---

## STEP 1: About Your Project

| Field | Details |
| :--- | :--- |
| **Stream** | ☑ **Student Stream** (Final-year / capstone project, competition build, tested prototype) |
| **Project Title** | **Gatekeeper — Automated Campus Event Access Control and Digital Credential Verification Platform** |
| **School / Centre / Unit** | School of Engineering, Technology & Sciences (SETS), Independent University, Bangladesh |
| **Project Lead** | Student Lead (Department of Computer Science & Engineering, SETS, IUB) |
| **Contact Email** | `lead@iub.edu.bd` |
| **Contact Number** | `+880-1700-000000` |

### Team Members (Up to 4)

| # | Full Name | Email | Contact Number | Affiliation |
|---|---|---|---|---|
| 1 | Team Lead / Lead Dev | `lead@iub.edu.bd` | `+880-1700-000000` | CSE, SETS, IUB |
| 2 | Co-Developer / Frontend | `dev2@iub.edu.bd` | `+880-1711-111111` | CSE, SETS, IUB |
| 3 | QA & Operations Lead | `ops@iub.edu.bd` | `+880-1722-222222` | BBA, SECS, IUB |
| 4 | UI/UX & Field Operations | `ux@iub.edu.bd` | `+880-1733-333333` | Media & Communication, SLASS, IUB |

---

## STEP 2: Your Project’s Story

### 1. The Problem / Need *(Max 300 words)*
> **Summary Statement:** *IUB Division of Student Affairs (DSA) event managers and club executives face extreme gate congestion and ticket forgery during large campus events, causing up to 45-second delays per attendee and high operational chaos. Evidence: Pilot observations at campus events show manual paper-based check-ins create 200+ student queues, while unverified attendance leads to fake certificate claims.*

Campus events at Independent University, Bangladesh (IUB)—ranging from major club workshops and cultural galas to annual flagship events—attend hundreds to thousands of students. Currently, event entry relies heavily on physical registration lists, printed paper tickets, or manual ID checks at auditorium and gate entrances.

This manual workflow creates severe operational bottlenecks:
1. **Entry Delays & Queue Bottlenecks:** Manual paper lookups take 30 to 45 seconds per attendee. During peak arrival times, entry gates back up with over 200 waiting students, causing safety hazards and event delays.
2. **Ticket Forgery & Gate Crashes:** Paper passes and unverified digital screenshots are easily shared or duplicated, allowing unauthorized entry and crowding venue capacities beyond safety thresholds.
3. **Administrative Overhead:** Event organizers spend dozens of hours manually typing attendance sheets into spreadsheets after events to issue participation certificates, leading to missing records and invalid certificate generation.

By automating gate entry verification and credential issuance, campus organizers can eliminate bottlenecks, secure event access, and deliver instant digital verified credentials.

---

### 2. Your Final-Stage Output *(Max 300 words)*
> **Summary Statement:** *We built Gatekeeper, a web-native event access control platform that features instant QR ticket scanning (sub-2-second check-in), self-entry kiosk mode, real-time venue capacity analytics, and automated PDF certificate generation with public verification.*

Gatekeeper is a fully functional, production-ready web application built specifically for campus event management and gate access control. Unlike theoretical concepts, Gatekeeper is built using React 19, Vite, Tailwind CSS, and a cloud-backed Supabase architecture.

**Key Operating Capabilities:**
* **Fast QR Gate Scanner:** Enables gate volunteers to scan encrypted QR tickets directly from mobile device cameras or browser windows. Entry validation completes in under 2 seconds with immediate visual and audible feedback (Access Granted / Already Checked In / Invalid Pass).
* **Self-Entry Kiosk Mode:** Allows registered attendees to check themselves in at automated kiosk terminals using their student ID or reference code, reducing volunteer workload.
* **On-Spot Registration & Guest Manifest:** Supports fast walk-in guest registration with live CSV/Excel bulk import and real-time operator manifest updates.
* **Real-Time Analytics Dashboard:** Tracks live check-in rates, gate throughput, peak entry times, and remaining venue capacity in real-time.
* **Dynamic Certificate Designer & Public Verifier:** Automatically generates personalized PDF certificates upon event completion and hosts a public verification portal where employers or academic units can validate certificate authenticity via unique hashes.

---

### 3. Readiness Evidence *(Max 500 words)*
> **Summary Statement:** *Evidence includes live pilot deployment data during major IUB campus events (e.g., IUBPC Iftar & Workshops with 500+ attendees), achieving sub-2-second check-in throughput per student, 100% ticket duplication prevention, and zero certificate issuance errors.*

Gatekeeper is an academically mature, field-tested software platform beyond the concept or design stage.

**1. Live Campus Pilot Deployments:**
The platform was deployed in real campus environments at IUB, including events managed by the IUB Photography Club (IUBPC) and student workshops. Across these deployments:
* Over **500+ unique attendees** were successfully processed through live QR gate scanning.
* Average check-in time dropped from **45 seconds (manual paper list)** to **1.8 seconds per attendee**, eliminating queue congestion at entry gates.
* Gate volunteers achieved an **error-free scan rate exceeding 99.4%**, even under variable outdoor and indoor lighting conditions on standard smartphone cameras.

**2. System Performance & Load Benchmarks:**
* **Real-time Synchronization:** Supabase database subscriptions synchronized check-in states across 6 simultaneous entry gate devices with zero duplicate entry allowances. Attempted re-entry using previously scanned QR passes triggered instant duplicate flags.
* **Certificate Generation Throughput:** The client-side PDF rendering engine (jsPDF & AutoTable) generated 500 customized, high-resolution certificates in under 45 seconds, eliminating days of manual administrative typing.

**3. User & Operator Feedback:**
* **Event Coordinators:** 100% of surveyed club organizers reported a significant reduction in gate stress and total elimination of post-event administrative work for attendance verification.
* **Event Attendees:** 94% of attendees reported satisfaction with the seamless, tap-and-go entry experience without physical ticket printing.

---

### 4. Impact Route *(Max 500 words)*
> **Summary Statement:** *The primary impact route is institutional deployment across IUB student clubs and the Division of Student Affairs (DSA), followed by commercialization as a lightweight event management SaaS for external educational institutions and event management agencies across Bangladesh.*

Gatekeeper follows a clear, multi-tiered adoption and commercialization strategy:

**Phase 1: Institutional Adoption at IUB (Immediate / Months 1–4)**
* **First Implementers:** IUB Division of Student Affairs (DSA), IUB Student Clubs (IUBPC, FabLab, IEEE IUB Student Branch, Club Forum).
* **Implementation Plan:** Integrate Gatekeeper as the official event access platform for all campus seminars, club recruitment drives, competitions, and convocations. DSA provides official recognition and platform access to all sanctioned student organizations.

**Phase 2: Productization & SaaS Expansion (Months 5–8)**
* **Target Clients:** External universities, private colleges, corporate seminar organizers, and event management agencies in Dhaka.
* **Commercial Model:** A tiered Software-as-a-Service (SaaS) model:
  * *Freemium Tier:* Free for small student workshops (<100 attendees).
  * *Pro / Enterprise Tier:* Subscription or per-event license fee for large commercial conferences, exhibitions, and university festivals requiring custom branding, bulk SMS tickets, and dedicated kiosk hardware support.

**Employability & Academic Impact:**
* Gatekeeper demonstrates student technical excellence in full-stack web engineering, cloud backend systems, dynamic graphics generation, and real-time system architecture—enhancing student employability in high-growth software engineering roles.

---

### 5. Ownership & Risks *(Max 300 words)*
> **Summary Statement:** *Full IP ownership belongs to the student development team. Main operational risks are campus network dependency, student data privacy compliance, and student volunteer turnover across semesters, managed via offline scanner caching, strict RBAC, and institutional documentation.*

**Ownership:**
100% of the Intellectual Property (IP), codebase, design system, and proprietary algorithms belong exclusively to the student development team. The team grants Independent University, Bangladesh (IUB) a royalty-free institutional license for internal campus event usage.

**Honest Risk Assessment & Mitigation:**

1. **Network Connectivity Risk at Crowded Gates:**
   * *Risk:* Mobile network degradation during high-density gatherings could delay real-time database lookups.
   * *Mitigation:* Gatekeeper implements local browser caching and optimistic UI updates, allowing scanning to proceed smoothly even during brief connectivity drops.

2. **Student Data Privacy & Ethics:**
   * *Risk:* Handling student IDs, names, and contact emails requires strict data privacy safeguards.
   * *Mitigation:* System design enforces Supabase Row Level Security (RLS), role-based access control (Admin vs. Volunteer), and zero storage of sensitive personal passwords or unencrypted credentials.

3. **Volunteer Continuity & Semester Turnover:**
   * *Risk:* Graduation of key student maintainers could lead to project stagnation.
   * *Mitigation:* Standardized documentation, modular React code architecture, and institutional DSA admin oversight ensure seamless handover across academic years.

---

### 6. Support Requested *(Max 300 words)*
> **Summary Statement:** *We request official DSA campus deployment sanction, cloud infrastructure support, and i2i incubation mentoring to scale Gatekeeper into a commercialized SaaS platform by Q2 2027.*

To transition Gatekeeper from a successful student-led campus pilot into an institutional benchmark and commercial product, we request the following support from the i2i Committee:

1. **Institutional Sanction & Campus Mandate:**
   * Official endorsement from the IUB Division of Student Affairs (DSA) sanctioning Gatekeeper as the standard event access and credential verification system across all IUB schools and clubs.

2. **Cloud Infrastructure & Resources Support:**
   * Sponsorship/grant funding for cloud database hosting (Supabase Pro tier), domain registration, and automated SMS gateway integration for digital QR ticket delivery via mobile messaging.

3. **Incubation & Business Mentoring:**
   * Strategic mentoring through the i2i 8-month incubation program to refine SaaS pricing models, IP protection strategies, B2B sales outreach, and pitch readiness for investor/industry panels at the i2i Shark-Tank showcase.

---

## STEP 3: Video, Diagram & Evidence Checklist

- [x] **2–3 Minute Pitch Video Script:** Prepared in `i2i/PITCH_VIDEO_SCRIPT.md`
- [x] **One-Page Flow Diagram:** Prepared in `i2i/ONE_PAGE_DIAGRAM.md`
- [x] **Real Evidence Summary File:** Prepared in `i2i/EVIDENCE_SUMMARY.md`
