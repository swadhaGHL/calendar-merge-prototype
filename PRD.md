# PRD — Unified Calendar (merging 5 legacy calendar types into one)

| | |
|---|---|
| **Owner** | Swadha Bhoj |
| **Status** | Draft for review |
| **Last updated** | 2026-04-27 |
| **Live prototype** | https://swadhaghl.github.io/calendar-merge-prototype/ |
| **Wizard (deep link)** | https://swadhaghl.github.io/calendar-merge-prototype/setup/meetings/new |
| **Booker widget + scenario picker** | https://swadhaghl.github.io/calendar-merge-prototype/booker-preview |
| **Source of truth (full decision log)** | [MERGE_TYPES_DISCUSSION.md](MERGE_TYPES_DISCUSSION.md) — 61 locked decisions, 32 edge cases, full settings matrix |

---

## TL;DR

GoHighLevel currently exposes 5 separate calendar types (Personal, Round Robin, Class, Collective, Event) — each with its own editor, its own restrictions, and its own help docs. Customers pick a type up front and are then locked out of capabilities they later need (e.g. a 1:1 calendar can't become a group session without recreating the calendar).

We're merging all 5 into **one unified calendar editor**. The user adjusts settings; the system derives a type label automatically. Customers can change their mind anytime — no recreation, no support ticket.

Service Booking is **out of scope** (deprecated, customers migrate to Services v2 — see decision #2). Recurring meetings beyond their current per-type behaviour are **deferred** to a follow-up release (see decision #10).

---

## 1. Background & problem

### Current state

Each calendar type today is a separate UI flow with type-specific restrictions:

- **Personal Booking** — 1 host, 1:1 meeting
- **Round Robin** — multi-host with rotation
- **Class Booking** — 1 host with group seats
- **Collective** — multi-host where everyone attends
- **Event** — 0-host registration

A customer who wants to add a 2nd team member to their Personal calendar can't — they have to delete it and create a new Round Robin. A yoga studio with multiple instructors can't put them all on one calendar — they need separate Class Bookings per instructor. The 5-types model fragments related decisions into separate code paths.

### Pain — quantified by support data

- The **#1 support ticket category** on calendar setup is *"I forgot to set the meeting location and the link wasn't generated"* — driven by the location field being optional + invisible inline copy
- A meaningful chunk of tickets are *"how do I change my X calendar to a Y calendar"* — answer today is "you can't, recreate it"
- Power users routinely run into Section B legacy gaps (Class can't use Zoom; Event can't use Booking Channels) that have no real reason to exist beyond historical implementation

### Why now

- The 5-type model has accumulated 5 years of inconsistent restrictions
- Multi-duration is being added across all types — would require parallel implementation in 5 editors
- New calendar capabilities (the AI setup assistant) need a unified config surface to target

---

## 2. Goals & non-goals

### Goals

1. **One calendar editor** customers can use to express any of the 5 legacy shapes through settings (no upfront type pick).
2. **Capability lifts** for legacy gaps that had no real reason to be restricted (Class on Zoom, Event with Booking Channels, External Sync everywhere, etc. — see Section B in the discussion doc for the full list).
3. **Settings change anytime** — adding a host, switching strategy, turning on group seats — no recreation needed. Existing appointments are preserved (decision #16).
4. **Backend continues to classify** for analytics/labels; customers see one of the 5 legacy names in the calendar list and the wizard chip (decision #5). No new labels invented.
5. **Drop the #1 support-ticket category** by gating Save on calendar name and recommending Location prominently (decisions #27, #37).
6. **No regression in conversion** for existing flows (booker drop-off, calendar-creation completion).

### Non-goals (out of scope for this release)

- **Recurring meetings expansion** — recurring keeps its current per-type behaviour exactly as-is (decision #10). Free-slots API rework deferred to follow-up.
- **Service Booking integration** — out of scope, customers migrate to Services v2 (decision #2). Existing Service calendars move to a separate tab post-launch (decision #60).
- **Multi-host rotate Class** — explicitly disabled (decision #58); not a real-world pattern in any major class platform (Mindbody / ClassPass / Vagaro all model class slots as one named instructor).
- **Multi-duration on Class** — paused with loud preservation copy (decision #56).
- **Migration UI** — none needed (decision #11). Backend handles data migration silently; existing calendars stay where they are.

---

## 3. Success metrics

### Primary outcome metrics

| Metric | Target | Source |
|---|---|---|
| % of new calendars created via the merged editor (post A/B graduation) | 100% | Internal analytics |
| Reduction in *"meeting link not generated"* support tickets | ≥ 50% in 90 days | Support taxonomy |
| Reduction in *"how do I change my calendar from X to Y"* tickets | ≥ 80% in 90 days (mostly resolved by enabling in-place edit) | Support taxonomy |
| Calendar creation completion rate (start → save) | No regression vs legacy editor (within 2 pp) | Funnel analytics |

### Quality bars (must hold)

- Booker conversion rate per existing calendar shape: no regression in A/B test
- No data loss when stale settings hide due to other settings changing (decision #16)
- No bookings fail because of mis-derived label or stale legacy field

### A/B test gating

Feature-flagged rollout (decision #18). The merged editor is gated; existing calendars open in the legacy editor by default; new calendars + opted-in users get the merged flow. Promotion to 100% requires the primary metrics hitting target.

---

## 4. Personas & user stories

### Persona A — New customer (first calendar)

> *"I just signed up. I want to set up a calendar for sales discovery calls — 30 min each, with one of three reps."*

User journey under the merged editor:
1. Click "+ New Calendar"
2. Pick the **Team Rotation** intent tile (or AI-detect from a typed intent)
3. Wizard pre-fills sensible defaults (3 hosts, rotate strategy, 30 min duration)
4. Tweak the calendar name, payment if any, save
5. Calendar appears in the list as **Round Robin** (the derived label)

### Persona B — Existing customer (settings change)

> *"My yoga studio added a second instructor. I want them to alternate teaching the Tue 10am yoga class."*

Today: customer can't — they have to delete their Class Booking and create a new one with multi-host setup.

Under the merged editor: customer opens their existing Class calendar, adds the 2nd instructor, the wizard auto-defaults them to rotate strategy. **But** — per locked decision #58, multi-host rotate + Class isn't supported (matches industry norm). The Group session card disables with inline fix-its: *"Switch to All members attend"* (one click) or *"Reduce hosts on Staff & assignment"* (link).

The intended workaround is documented: create a separate calendar per instructor (the Mindbody / Vagaro pattern).

### Persona C — Booker (end customer)

> *"I want to book a meeting with company X."*

Booker UX is largely unchanged for the 5 standard cases. Improvements:
- Multi-location calendars now offer the booker a radio of options
- Ask-the-booker calendars show a *"Where would you like to meet?"* text input
- Class calendars with guests enabled count guests against capacity (visible *"5 seats remaining"* updates as guest count changes)

Round Robin is unchanged. Collective shows the avatar stack of attending hosts. Class shows *"Hosted by [Name]"* (the link host) when the calendar uses a video tool.

---

## 5. Solution summary

The merged calendar has **4 dimensions** that compose into the 5 legacy type labels:

1. **Host count** — 0, 1, or 2+
2. **Assignment strategy** (when 2+ hosts) — `rotate`, `collective`, `mixed`
3. **Booking behavior** — `separate` (Parallel slots) or `shared` (Group session)
4. **Capacity** (`seatsPerSlot`) — 1 or N

The derived label resolves from these dimensions in this order (first match wins):

| Conditions | Derived label |
|---|---|
| `staff = 0` (any seats / behavior) | **Event Calendar** |
| `shared && seats > 1 && staff ≥ 1` | **Class Booking** |
| `staff > 1 && strategy ∈ {collective, mixed}` | **Collective Booking** |
| `staff > 1 && strategy === 'rotate'` | **Round Robin** |
| `staff === 1` | **Personal Booking** |

See locked decision #44 for why staff=0 takes priority (Event template was previously deriving as Class Booking — confusing).

The wizard surfaces this through:
- **Soft template tiles** at create-time (1:1 Meeting / Group Session / Team Rotation / Panel / Event) — pre-fill defaults but don't gate anything (decision #5 amended, #9)
- **Live derived-label chip** at the top of the wizard — updates as the user changes settings
- **Capacity per slot** as 3 outcome cards (Single booking / Parallel bookings / Group session) — replaces the older mode-radio + number-input pattern (decision #52)
- **Single Meeting Location card** — shape-aware, 7-option menu always visible with disabled states for unsupported (decision #31, refined in #58)

---

## 6. Functional requirements

### 6.1 Calendar list

- Type column shows the derived label (Personal Booking / Round Robin / Class Booking / Collective Booking / Event Calendar). Updates when settings change (decision #4).
- "+ New calendar" launches the unified wizard. Service Booking is **not** an option (decision #60).
- Existing Service Booking calendars move to a separate tab post-launch (mirrors the v1 → v2 segregation pattern). Customers can still access them via direct links until they migrate.
- No migration UI (decision #11).

### 6.2 Wizard / editor

The wizard has 5 visible tabs (Basic details / Staff & assignment / Availability / Booking rules / More settings) plus inline expandable sub-sections.

#### 6.2.1 Basic details
- Calendar name (required to save — Save button gated, see #27)
- URL slug, description, branding (logo, color)
- Booking URL surfaced as a primary field (Session 2 finding #9)
- Live derived-label chip at the top, clickable for full summary popover

#### 6.2.2 Staff & assignment
- Team members card with inline add dropdown
- For multi-host RR / non-shared Class: location dropdown sits **inline next to each team-member row** (full 7-option menu with disabled states; "Ask the booker" disabled with a tooltip explaining the rotation constraint — decision #34)
- Display label affordance under in-person locations (decision #59)
- Strategy cards (Rotate / All members attend / Mixed) — visible only when 2+ hosts (decision #45 — strategy resets to null if hosts drop below 2)
- Mixed: `MemberRoleAssigner` with required/rotating segmented toggle per row + inline owner star on required rows. Last required member can't be demoted (decision #42)
- Collective: owner star inline on every team-member row (decision #41)
- Advanced routing rules expander (Distribution algorithm, Host priority, Contact routing) — visible only when meaningful (multi-host + rotate or mixed; specific sub-rules per decision #14, #21, #22, #23, #43)
- Recurring + multi-host: confirm modal **before** the host is added (decision #46) — replaces the earlier silent toast pattern

#### 6.2.3 Availability
- Recurring toggle visually disabled when multi-host with helper *"Available with one host only..."* (decision #31 of session 2)
- Otherwise standard availability (per-host schedules, intersected when multi-host — decision #14)

#### 6.2.4 Booking rules
- **Capacity per slot** — 3 outcome cards in this order: Single booking → Parallel bookings → Group session (decisions #52, #54)
- Group session card **disabled when multi-host + rotate** with inline fix-its: *"Switch to 'All members attend'"* (one-click) or *"Reduce hosts on Staff & assignment"* (link to tab) (decision #58)
- Parallel card **disabled when multi-host + collective/mixed** with inline hint
- Capacity number lives inside the chosen card; sensible defaults bumped on selection
- Total summary chip below the cards when multi-host + seats > 1
- **Guests card** (its own sibling card) — shape-aware copy + booker preview (decisions #51, #53)
- Multi-duration list paused with loud preservation copy when calendar is Class shape (decision #56)
- Booking window (notice + range) and buffers per existing UX

#### 6.2.5 More settings
Existing tabs (Form, Payments, Notifications, Widget, Booking channels) — unchanged in IA, with these specific updates:
- **Notifications**: assign-contacts toggle gated on `teamMembers.length > 0` (decision #32 edge case)
- **Widget**: Classic widget gets group-seat support (engineering work — decision #29 of session 2)

### 6.3 Booker widget

Two-page flow matching the GHL production widget UX:

**Page 1 — Date & Time:**
- Left identity panel: logo, calendar name, duration, date placeholder, host (or *"A host will be assigned"* for multi-host rotate), location chip (display label or category — never raw value), payment summary, description, attendee avatars (Collective/Mixed)
- Right: month nav + calendar grid + time-zone picker + vertical time-slot list

**Page 2 — Enter Details:**
- Left identity panel updates: back arrow + selected host + selected time + time zone + location chip + payment summary
- Right: First Name + Last Name, Phone (with country flag) + Email, Additional Information textarea, consent checkbox, Add Guest button (with shape-aware seat-counting copy), Payment information section (when payments enabled), Schedule Meeting CTA

Multi-location calendars surface a radio picker on Page 2; ask-the-booker shows a text input.

### 6.4 AI setup assistant — proposed flow (working draft, see decision #61)

The current AI flow is type-bound and doesn't model Mixed. Refresh to a 4-stage dimensional flow:

1. **Intent capture** — user types free-form intent
2. **AI inference** — surfaces calendar dimensions (name, duration, capacity, host count, payment) — never legacy types
3. **Confirmation questions** (1–3 max, plain English, never *"Round Robin / Collective / Mixed"* terms): *"Who hosts?"* / *"How are bookings shared between them?"* / *"Where will it run?"* / *"Do you charge for this?"*
4. **Plain-English summary + apply** — *"Looks good — create"* or *"Edit in wizard"*

The AI must NOT generate multi-host rotate Class, multi-duration Class, or multi-host calendars with recurring on (without surfacing the trade-off). See decision #61 for the full spec including edge cases.

Engineering owns the prompt + tool-use schema refresh; product owns the question taxonomy + plain-English translations.

---

## 7. Settings matrix (current state across legacy types)

> Service Calendar shown for completeness but **out of scope**.

### Team Members
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| No. of Hosts | 1 | Min 1 (rotating) | 0 | 1 | Min 2 (all mandatory) |

### Meeting Location
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| Custom | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phone | ✅ | ✅ | ✅ | lifted | ✅ |
| Full Address | ✅ | ✅ | ✅ | lifted | ✅ |
| Zoom | ✅ | ✅ | lifted | lifted | ✅ |
| Google Meet | ✅ | ✅ | lifted | lifted | ✅ |
| Teams | ✅ | ✅ | lifted | lifted | ✅ |
| Ask the Booker | ✅ | per-host | ✅ | n/a | ✅ (lifted) |
| Multiple Locations | ✅ | per-host | ✅ | n/a | ✅ (lifted) |

### Booking Rules
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| Standard rules (Interval / Duration / Notice / Range / Buffers) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Max Bookings/day | ✅ | ✅ | ✅ | lifted | ✅ |
| Max Bookings/slot (Parallel) | ✅ | ✅ | ✅ | n/a | n/a (parallel disabled) |
| Look Busy | ✅ | ✅ | ✅ | lifted | ✅ |
| Group capacity (Seats per class) | shared+seats>1 only | n/a (group disabled #58) | shared+seats>1 only | ✅ | shared+seats>1 only |

### Form / Notifications / Widget / Channels
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| Add Guests | ✅ | ✅ | ✅ | lifted | ✅ |
| Email + In-app + SMS + WhatsApp | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assign contacts to staff | ✅ | ✅ | hidden when 0 hosts | ✅ | ✅ |
| Allow Staff Selection | n/a | ✅ (rotate-only, decision #21) | n/a | hidden #58 | n/a |
| Show seats/slot to bookers | n/a | n/a | shared+seats>1 only | ✅ | shared+seats>1 only |
| Neo Widget | ✅ | ✅ | ✅ | ✅ | ✅ |
| Classic Widget | ✅ | ✅ | ✅ | lifted (group seats added — eng) | ✅ |
| Booking Channels | ✅ | ✅ | lifted | ✅ | ✅ |
| External Sync | lifted | lifted | ✅ | lifted | lifted |
| Display label (in_person locations) | ✅ | per-host | ✅ | ✅ | ✅ |

**"lifted"** = was previously blocked, now unblocked (Section B in discussion doc).

---

## 8. Edge cases & auto-corrections

The merged editor handles these state transitions automatically. None are silent — each surfaces a notice or modal.

| Trigger | Behaviour | Locked decision |
|---|---|---|
| User adds 2nd host while recurring is on | Confirm modal *"Adding a second host will turn off recurring. Continue?"* — only on Continue does the host get added and recurring auto-disable | #46 |
| User adds 2nd host with no strategy yet | Strategy auto-defaults to `rotate` | #25 (session 2) |
| User picks Mixed with no required attendees | First team member auto-marked Required | #17 |
| Mixed, all required (zero rotating) | Inline notice *"this saves as Collective Booking"* — saveCalendar() persists strategy as `collective`, clears `requiredAttendeeIds` | #47 |
| Mixed, all rotating (zero required) | Inline notice *"this saves as Round Robin"* — saveCalendar() persists strategy as `rotate`, clears `requiredAttendeeIds` | #47 (revised) |
| User tries to demote the last required member in Mixed | Rotating button is disabled with tooltip pointing to strategy switch | #42 |
| Owner removed (host kicked) | Owner auto-promotes to next eligible (Mixed: next required; Collective: next member) | #19 |
| Strategy switches Collective → Mixed and old owner is now rotating | Owner auto-promotes to first required member | #19 |
| Member's source for a video tool becomes unavailable (host removed, demoted from required, tool disconnected) | `sourceUserId` auto-corrects to next eligible; if no eligible left, calendar location falls back to first dropdown option | #40 (auto-correct watcher) |
| Class shape activates with multi-duration set up | Extra durations show as "Paused" chips; loud amber notice *"Multiple durations paused for Class — they're preserved and will come back if you switch to a non-shared shape"*; the Add-duration button hides | #56 |
| User picks Group session card while multi-host rotate | Card is disabled with inline fix-its: *"Switch to 'All members attend'"* (one-click button) and *"Reduce hosts on Staff & assignment"* (link) | #58 |
| Host count drops below 2 | `assignmentStrategy` resets to `null`, `requiredAttendeeIds` cleared | #45 |
| Host count drops to 0 | Same as above; derived label becomes Event Calendar | #44, #45 |
| User edits an existing recurring calendar with multi-host | Recurring toggle renders as visually disabled with helper *"Available with one host only..."* | #31 (session 2) |
| Existing data has multi-host rotate + Class shape (legacy migration) | Defensive watcher in `BookingRulesUnified` flips `bookingBehavior = 'shared'` to `'separate'` on detect — needs backend migration spec | Engineering note |
| 1-host single-attendee + Group session selected | Seats auto-bumps to 5 ("Group session with 1 attendee" is functionally identical to "Parallel slots with 1 booking") | superseded by #52 (cards inherit the bump on selection) |

See the **Edge cases ledger** in the discussion doc for the full set of 32 resolved combinations + rationale.

---

## 9. Rollout plan

### A/B test (decision #18)

Feature-flagged. Cohorts:

- **Control** — existing customers using the legacy 5-type editors
- **Treatment** — opted-in customers + all new sign-ups, using the merged editor

Promotion to 100% gated on:
- Primary metrics (Section 3) hitting target
- Quality bars (no regression in booker conversion or calendar-creation completion)
- No critical bugs reported in the merged editor

Existing calendars stay editable via the legacy editor until the customer's account flips to treatment, then they open in the merged editor (no migration needed — backend mapping handles the field translation, see Engineering notes below).

### Migration

- **No customer-facing migration UI** (decision #11). Existing calendars just continue to appear in the calendar list with their current (legacy) labels.
- **Backend mapping table** required: each legacy `_oldType` value maps to a default `(strategy, seatsPerSlot, bookingBehavior, locationMode)` triple. Engineering owns the spec — see Engineering notes section.
- **Service Booking calendars** move to a separate tab post-launch (decision #60).

### Help docs (decision #19)

Required updates:
- Derived-label rules table (Section 5)
- Capacity-per-slot semantics across strategies (Section 24 of discussion doc)
- How to convert an existing calendar's shape (any-time editing per decision #1)
- Multi-host rotate + Class workaround (separate calendars per instructor)
- Multi-duration on Class workaround (separate calendars per duration)
- Display label feature explanation
- AI setup assistant flow refresh

### Communications

- Internal: GHL support team trained on the new editor + the changed terminology (no more *"create a Round Robin"* — instead *"add a second host to your calendar"*)
- External: customer-facing changelog when treatment rolls past internal users
- Webinars / videos for power users transitioning their existing calendars

---

## 10. Engineering notes (track during implementation)

These are eng-driven items called out by product:

| Item | Owner | Notes |
|---|---|---|
| **Classic widget gets group-seat support** | Engineering | Locked product decision; needs scoping. Until shipped, calendars in Class shape on Classic widget should fall back gracefully. |
| **Data migration mapping** | Engineering | Legacy `_oldType` → `(strategy, seatsPerSlot, bookingBehavior, locationMode, displayLabel)`. Spec the table before implementation. |
| **Free-slots API** | Engineering | Recurring expansion explicitly deferred (decision #10). Don't touch the free-slots API in this release. |
| **Analytics events** | Engineering + Analytics | Keep internal `type` field for analytics (decision #1). Add events for: parallel-class spawn (n/a after #58), multi-host group session creation, multi-duration selection, location skip, Mixed normalization at save. |
| **A/B test gating** | Engineering | Feature flag the merged editor experience. |
| **AI setup assistant prompt + tool-use schema** | Engineering (with product input on question taxonomy) | See decision #61 for the proposed flow. Refresh maps intent dimensions → unified-calendar config fields directly (no legacy-type intermediate). |
| **Helper text consistency** | Engineering | Single string-table pass. Search-and-replace any legacy *"Personal Booking / Round Robin / etc."* strings outside the derived-label rules. |
| **Display label schema** | Engineering | Already documented (decision #59) — `displayLabel?: string` on `MeetingLocation`. Backend stores and returns it; pre-confirmation booker view renders the label, post-confirmation renders the actual `customValue`. |

---

## 11. Open questions & risks

### Open questions (need resolution before implementation kickoff)

1. **AI assistant question taxonomy** — product owns the question wording + plain-English translations of strategy. Workshop needed to finalize.
2. **Service v1 → separate tab UX** — visual treatment of the Service Bookings tab on the calendar list. Mirror Services v2 v1 segregation pattern but confirm with the Services v2 team.
3. **Backend mapping table** — engineering needs to spec the legacy `_oldType` → unified-config mapping. Should be straightforward but worth a sync to confirm no edge cases.

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A/B test shows booker conversion regression | Medium | High | Phased rollout — internal first, then 1% → 10% → 50%. Watch booker funnel daily during ramp. |
| Customers confused by the merged editor (mental model shift from 5 types → settings) | Medium | Medium | Soft template tiles preserve the type-first mental model for new users (decision #5/#9). Help docs + in-app onboarding for power users. |
| Edge cases in legacy data migration | Medium | Medium | Defensive watchers already in the editor (e.g. invalid combos auto-correct on load). Spec the mapping table thoroughly. |
| AI assistant generates configs that hit the new restrictions (multi-host rotate + Class, multi-duration + Class) | High | Low | AI flow draft (decision #61) explicitly enumerates what NOT to generate. Engineering must enforce in the prompt + tool-use schema. |

---

## 12. Appendix

### A. Glossary

- **Derived label** — the type name shown to the customer (Personal Booking / Round Robin / Class Booking / Collective Booking / Event Calendar). Computed from settings, never picked directly.
- **Strategy** — for multi-host calendars, how bookings are distributed: `rotate` (round-robin), `collective` (everyone attends), `mixed` (some required + others rotate).
- **Booking behavior** — `separate` (each booking is its own meeting) or `shared` (multiple bookers join one meeting).
- **Capacity** (`seatsPerSlot`) — for shared behavior, attendees per session; for separate behavior, parallel bookings per slot per host.
- **Display label** — optional friendly name shown to bookers pre-confirmation; the actual `customValue` is only revealed in the booking confirmation.
- **Per-host location** — multi-host rotate calendars use a per-host inline location dropdown in each team-member row; the assigned host's location is used for that booking.
- **Hosted by** — for shared video tools (Collective/Mixed), specifies whose account hosts the link.

### B. Full decision log

All 61 locked decisions live in [MERGE_TYPES_DISCUSSION.md](MERGE_TYPES_DISCUSSION.md), organized into:

1. **Product foundation** (#1–19) — scope, type-derivation, soft tiles, recurring deferral
2. **Session 2 — UI/IA implementation log** (#20–30) — wizard sidebar, capacity behaviour radio, Meeting Location 4-mode picker (later replaced)
3. **Session 3 — Capacity & Location overhaul** (#31–54) — Meeting Location single card, 3-card capacity, Guests promotion, Mixed normalization, Class restriction
4. **Session 4 — Booker widget rebuild + AI flow + production polish** (#55–61) — multi-host rotate Class disabled, Class + 1-host or Collective/Mixed only, display label, AI flow proposal, Service Booking separation

### C. Edge case ledger

32 resolved edge cases — see "Edge cases ledger" section in the discussion doc for the full list with question + resolution + rationale.

### D. Linked artifacts

- **Live prototype** — https://swadhaghl.github.io/calendar-merge-prototype/
  - **Wizard**: https://swadhaghl.github.io/calendar-merge-prototype/setup/meetings/new
  - **Booker preview** (with one-click scenario picker): https://swadhaghl.github.io/calendar-merge-prototype/booker-preview
- **Source repo** — https://github.com/swadhaGHL/calendar-merge-prototype
- **Source of truth doc** — [MERGE_TYPES_DISCUSSION.md](MERGE_TYPES_DISCUSSION.md)
