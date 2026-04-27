# Merging of Calendar Types — discussion handoff

> Pick this up in Claude Code from `~/codebase/calendar-information-architecture`.
> Tell Claude: "Continue the merging-of-calendar-types discussion. Read `MERGE_TYPES_DISCUSSION.md` for state."

## What we're doing

Finalising the **product** definition (no backend / data-model / rollout talk yet) for merging the legacy calendar types into one unified calendar. We'll write a PRD only after the product is locked.

**Core intent (per Swadha):** Remove the rigidness of calendars. A user builds a calendar by adjusting settings; the system classifies it (based on host count + a couple of other key identifiers) on the backend. When they want to change something — add a host, flip from rotate to collective, turn on group seats — they just edit. They never need to delete and recreate a calendar to change its "type." Labelling is a downstream/backend concern, not a product debate.

**In scope** — merging these 5 types into one:
- Personal
- Round Robin
- Class Booking
- Collective
- Event

**Out of scope** — Service Booking. It will be deprecated; customers move to Services v2.

## Locked decisions

1. **Type still exists internally for analytics**, but customer-facing it's purely derived from settings. Customers can change anything anytime; the type follows.
2. **Service Booking is excluded** from this merge entirely.
3. **No implementation talk** until product is locked — no schema, API, rollout, entitlements, etc.
4. **Calendar list keeps the Type column and Type filter**, with values derived from settings. Updates automatically as settings change.
5. **No renaming — applies to derived labels only, not starter tiles.** Derived labels (shown in the wizard chip, calendar list Type column, and filters) reuse the existing 5 legacy names — Personal Booking, Round Robin, Class Booking, Collective Booking, Event Calendar. No new labels introduced ("1:1", "Panel", "Open Event", "Mixed" — dropped). **Starter tiles in TemplatePicker stay intent-based** (e.g. "1:1 Meeting / Group Session / Team Rotation / Panel / Committee / Event") because tiles describe a use case the user wants, not a type they're picking. Once a calendar is created, the legacy-name derived label takes over. Tile name never propagates to the calendar name (already enforced — see Session 2 finding #5).
6. **"Mixed" mode collapses to Collective Booking.** When `strategy = mixed` with `0 < requiredCount < staffCount`, the calendar shows as **Collective Booking**, not a separate "Mixed" label.
7. **No migration tooltip, no banner.** Because nothing renames, there's nothing to explain on the list.
8. **Label mapping is a backend concern, not a product debate.** Don't litigate edge-case naming (e.g. "rotate + group seats"). The backend classifies based on host count + a couple of key identifiers and picks one of the 5 legacy labels. The product job is to make settings freely editable — the label follows.
9. **Soft template tiles at create time.** Keep "Personal / Round Robin / Class / Collective / Event" as starter tiles that just pre-fill sensible defaults — they don't gate or lock anything. Reasoning: thousands of agencies + HubSpot/Calendly users know these names; removing them harms onboarding. But every setting stays editable post-creation, so the tile is a head-start, not a commitment.
10. **Recurring is OUT of this release.** Expanding recurring to new combos would require changes to the free-slots API, which is too risky to bundle. Recurring keeps its current per-type behaviour exactly as-is (Personal/Event/Class: yes; Round Robin: only if 1 member; Collective: no). **Crucial scope rule: recurring works with 1 host only**, regardless of calendar type. Picked up as an enhancement after the merge ships.

11. **Migration screen not required.** Existing customers continue to see their calendars in the existing list. "+ New calendar" starts the new (merged) flow. No dedicated migration UI, no banner, no dialog. Backend handles the data migration silently.

12. **AI setup assistant — reuse existing UI as-is.** Copy doesn't need to mention legacy type names. Whatever the assistant generates, the resulting calendar's settings flow through the same merged editor.

13. **Booker widget — minimal change.** Bookers only ever pick a host on **Round Robin** and **Class Booking** calendars. For Collective and Mixed, bookers don't pick (everyone / required hosts always attend). Round Robin booker UX is already sorted in production. **Class Booking booker UX is parked** — see Class Booking parking lot below.

14. **Availability is always per host.** Each host has their own schedule; there's no calendar-level availability override. Multi-host calendars use the intersection of host schedules.

15. **Payments UI doesn't change.** Same UI as today; existing screenshots apply. The matrix lift (Class blocking payments → unblock) is a backend gate flip, not a UI change.

16. **Stale-data policy — preserve.** Settings and per-host data persist when fields hide due to other settings changing. Re-applying the conditions brings the data back. **An existing appointment stays exactly as it was at creation time** even if the calendar's settings change later — historical bookings don't morph.

17. **Copy consistency** — single naming pass before PRD: settle on "Group session" / "Class Booking" / "Parallel slots" terms and use them consistently across all tabs and helper text.

18. **Rollout — A/B test.** Feature-flagged rollout, A/B comparing the merged editor vs. legacy. Pricing tiers don't change.

19. **Help docs are required.** Customer-facing documentation needs updating: derived label rules, capacity-per-slot semantics across strategies, how to convert an existing calendar's shape, etc.

## Discussion style

- Walk one screen of the prototype at a time.
- One question per turn. Concise.
- No big agenda dumps — Swadha can't process those.

## Where we are

The wizard is fully built out and Staff & assignment + Booking rules have both been through major IA overhauls. Latest pass (Session 3, 2026-04-26):

- **Meeting Location IA** is now a single shape-aware card (no more 4-mode picker, no more parallel `LocationPicker.vue`). For multi-host RR/Class the per-host location dropdown sits inline next to each team-member row. For Collective/Mixed the dropdown shows tool categories with a "Hosted by" sub-picker. (Decisions #31–40, #44, #45.)
- **Capacity per slot** is now a 3-card outcome picker (Single booking / Parallel bookings / Group session) with the number inside the chosen card. Behavior radio + auto-bump is gone. (Decisions #50, #52, #54.)
- **Guests** is now its own sibling card with shape-aware explanation + booker preview. (Decisions #51, #53.)
- **Owner pick** is inline on team-member / required-member rows — the standalone "Primary owner" card is gone. (Decision #41.)
- **Strategy reset** now happens cleanly when host count drops below 2; **Mixed all-required** auto-collapses to Collective on save; **recurring + multi-host** uses a confirm modal before disabling. (Decisions #42, #45–47.)
- **Save** is gated on calendar name only — location is recommended, not required. (Decision #37 revised.)

What's left for the next session:

- **Booker widget preview** (`BookerWidgetPreview.vue`) — partly stale; needs to reflect the new shape-aware location IA.
- **Migration view** (`MigrationDemo.vue`) — not yet walked through.
- **AI setup assistant** (`AISetupAssistant.vue`) — not yet walked through.
- **Class booker UX** — parking lot below.
- **Outstanding cleanups** — see "Open issues — TODO for next session" at the bottom.

Past session pointers: Session 2 (2026-04-25) did the initial Chief-of-Product-Design audit and the Meeting Location 4-mode picker (later replaced in Session 3). See "Session 2 — UI/IA implementation log" and "Session 3 — Capacity & Location overhaul" below.

## Screens still to walk through (in order)

1. Calendar list — `MeetingsVertical.vue`  ✅ done
2. Template picker (create new) — `TemplatePicker.vue` ✅ done (kept as soft tiles)
3. Wizard / editor — `CalendarWizardPage.vue` and the per-tab components in `src/components/prototype/`  ← we are here
4. Migration view (existing calendars list) — `MigrationDemo.vue`
5. AI setup assistant — `AISetupAssistant.vue`
6. Booker widget preview — `BookerWidgetPreview.vue`

For each screen, the kinds of questions to surface (one at a time):

- What does the user see / pick / type?
- What words appear (tile names, chip labels, column headers, copy)?
- What's the "delight" moment vs. the "wait, what?" moment?
- What does the booker (end customer) experience, if anything changes?

## Reference — prototype structure

Run with `cd prototype && npm run dev`.

- `src/data/mockCalendars.ts` — `UnifiedCalendarConfig`, templates, fixtures with `_oldType` + `_oldTypeLabel`.
- `src/composables/useCalendarState.ts` — `derivedType` rules (the type-from-settings logic).
- `src/components/prototype/StaffAssignment.vue` — strategy + members + locations.
- `src/components/prototype/BookingRulesUnified.vue` — capacity, seats, behaviour.
- `src/components/prototype/MigrationDemo.vue` — the migrated-list view.
- `src/components/setup/MeetingsVertical.vue` — the calendar list (entry point).
- `src/pages/CalendarWizardPage.vue` — the editor shell.

## Reference — derived label rules (REVISED — uses legacy names only)

In order, first match wins. **`staffCount === 0` always wins → Event Calendar** (a host-less calendar can't be a Class — there's no host to run the session). For any-host calendars, a shared appointment with `seats > 1` derives as Class Booking. "Max bookings per slot" (parallel independent bookings, behavior=separate) is just capacity and never changes the label.

| Conditions | Derived label |
|---|---|
| **staff = 0** (any seats / behavior) | **Event Calendar** |
| shared appointment ON, capacity > 1, staff ≥ 1 | Class Booking |
| strategy = collective or mixed, staff > 1, non-shared | Collective Booking |
| strategy = rotate, staff > 1, non-shared | Round Robin |
| staff = 1, non-shared | Personal Booking |

**Rule reordered 2026-04-26:** `staffCount === 0` was previously third in the list; the Event template (which ships with `seats=50, behavior=shared`) was deriving as Class Booking, which contradicted the user's tile pick. Moving the staff-zero check to first slot makes Event Calendar always honest, and removes the "host-less Class" combo (decision #44).

Note: the type label is purely informational — it never gates capability. Settings can be edited freely; the label simply follows.

Note: the prototype's `useCalendarState.ts` still implements the old 6-label scheme (1:1 / Panel / Open Event / Mixed). That code needs updating to match this rule table, but only after the product is fully locked.

## Reference — settings matrix (current state across legacy types)

> Service Calendar is shown for completeness but is **out of scope** (deprecated).

### Team Members
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| No. of Hosts | 1 | Min 1 (rotating) | 0 | 1 | Min 2 (all mandatory) |

### Meeting Location (Yes / No, with notes)
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| Custom | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phone | ✅ | ✅ | ✅ | ❌ | ✅ |
| Full Address | ✅ | ✅ | ✅ | ❌ | ✅ |
| Zoom | ✅ | ✅ | ❌ | ❌ | ✅ |
| Gmeet | ✅ | ✅ | ❌ | ❌ | ✅ |
| Teams | ✅ | ✅ | ❌ | ❌ | ✅ |
| Ask the Booker | ✅ | ⚠️ only if 1 member | ✅ | ❌ | ✅ (lifted 2026-04-26) |
| Multiple Locations | ✅ | ⚠️ only if 1 member | ✅ | ❌ | ✅ (lifted 2026-04-26) |

### Recurring
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| Recurring Meetings | ✅ | ⚠️ only if 1 member | ✅ | ✅ | ❌ |

### Booking Rules
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| Meeting Interval / Duration / Min Notice / Date Range / Post Buffer | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all |
| Pre Buffer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Max Bookings per day | ✅ | ✅ | ✅ | ❌ | ✅ |
| Max Bookings per slot | ✅ | ✅ | ✅ | ❌ | ❌ |
| Look Busy | ✅ | ✅ | ✅ | ❌ | ✅ |
| Seats per class | ❌ | ❌ | ❌ | ✅ | ❌ |

### Form & Confirmation
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| Sticky Contacts / Consent Checkbox | ⚠️ default form only | same | same | same | same |
| Add Guests | ✅ | ✅ | ✅ | ❌ | ✅ |

### Payments / Notifications / Additional
| | Personal | Round Robin | Event | Class | Collective |
|---|---|---|---|---|---|
| Collect Payments for Guests | ✅ | ✅ | ✅ | ❌ | ✅ |
| Email & In App | ✅ | ✅ | ✅ | ✅ | ✅ |
| SMS & WhatsApp | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assign contacts to staff + skip | ✅ | ✅ | ❌ | ✅ | ✅ |
| Allow Staff Selection | ❌ | ✅ | ❌ | ❌ | ❌ |
| Show seats per slot | ❌ | ❌ | ❌ | ✅ | ❌ |
| Neo Widget | ✅ | ✅ | ✅ | ✅ | ✅ |
| Classic Widget | ✅ | ✅ | ✅ | ❌ | ✅ |
| Booking Channels | ✅ | ✅ | ❌ | ✅ | ✅ |
| External Sync | ❌ | ❌ | ✅ | ❌ | ❌ |

## Widget Type (Classic vs Neo) — open

**Today's state:**
- **Neo widget**: supported on all 5 in-scope types (Personal / Round Robin / Event / Class / Collective).
- **Classic widget**: supported on Personal, Round Robin, Event, Collective. **Not** supported on Class. ~40% of users still book on Classic. **Classic is no longer being deprecated** — it's a first-class, permanent widget choice.

**Why it matters for the merge:** if a user takes a Classic-supported config (e.g. Personal) and edits it into a Class-shaped config (turns on Seats per class), the Classic widget can't render the group-seat UI. We have to decide what happens.

**Resolved:** Build group-seat support into Classic. It's not a big UI change. Once shipped, both Classic and Neo support every merged-calendar combo — widget choice becomes a pure presentation preference, never a capability gate. This keeps the unified-calendar promise honest for the ~40% on Classic.

## When does something "break"? — first-cut categorisation

Three buckets for every red cell above:

### A. Structural — restriction is real, must persist as conditional UI in the merged editor
*(setting only makes sense in certain configurations; the editor hides it when irrelevant)*
- **Allow Staff Selection** — only available when host count > 1 **and** strategy = rotate (Round Robin). Includes Class with multi-host (which is structurally multi-host + rotate + group seats). When ON, booker sees a host dropdown; that pick applies to that booking only. **Default OFF**, user opts in. **Hidden** when conditions aren't met.
- **Show seats per slot (booker UI)** — only meaningful when "Seats per class > 1" is on. Tied to that toggle. **Hidden** when seats per class is off / 1.
- **Assign contacts to staff (+ skip)** — requires hosts ≥ 1. **Hidden** when hosts = 0 (Event case). Behaviour: contact gets assigned to the **primary** host. In Collective, all other mandatory hosts are added as **followers**. In Round Robin, the rotation-assigned host is primary.
- **Meeting distribution** (Maximise availability / Equal distribution) — only visible when multi-host + strategy is rotate or mixed. (Today: RR only; merged: lift to mixed too.)
- **Host priority** (High / Medium / Low per staff member) — sub-setting of "Maximise availability". Only visible when meeting distribution = availability AND multi-host + rotate/mixed. High-priority hosts get assigned first, lower priority as fallback.
- **Contact routing preferences** — only visible when **strategy = rotate** (Round Robin). Doesn't apply to Collective or Mixed because those configs don't have a routing decision to make (everyone / required-set always attends). Two sub-settings:
  - *Reschedule preference:* "Reassign through round robin" (default) vs "Keep the same appointment owner" — what happens when a contact reschedules.
  - *New appointment preference:* toggle "Always book with the contact's assigned user" — overrides rotation for known contacts, books with their assigned user instead.
- **Primary owner picker (for Collective + Mixed)** — when strategy is Collective or Mixed, one of the required attendees must be marked as the **owner**. Bookings get assigned to the owner; other required members are added as **followers**. Constraints:
  - For **Collective**: any team member can be the owner (all are required).
  - For **Mixed**: the owner must be drawn from the required-attendees set. Rotating-pool members are not eligible.
- **Group / shared appointment toggle (formerly "Seats per class")** — when ON, one appointment slot holds multiple attendees who all share the same meeting (Class Booking model: one Zoom link, group session, single host). Capacity field appears below the toggle.
- **Max Bookings per slot (independent parallel bookings)** — separate setting. Defines how many *independent* appointments can happen in parallel during the same time window (e.g. a doctor with 3 rooms taking 3 separate patients each hour). Doesn't change the calendar's type — it's just capacity.
- These two were previously conflated under "Seats per class". They are **two separate settings**: shared (group, single appointment) vs. parallel (independent, multiple appointments). Only the *shared* toggle flips the derived label.

### A.1 Always-visible (so capability stays discoverable from any starting tile)
- **Seats per class toggle** — always visible (off by default).
- **Widget Type (Classic vs Neo)** — both widgets reach parity (group seats added to Classic). Always available.

### B. Legacy gaps — no real reason for the restriction; lift on day one (or scoped follow-up)
*(any of these could already work; they were just never built for that type)*
- **Class blocks Phone / Address / Zoom / Gmeet / Teams** — classes run online all the time; obvious gap.
- **Class blocks Max Bookings/day, Look Busy, Add Guests, Collect Payments per guest** — all arbitrary; per-guest payment for Class is a real feature need.
- **Class blocks Classic Widget** — arbitrary.
- **Event blocks Zoom / Gmeet / Teams** — online events are common; clear gap.
- **Event blocks Booking Channels** — arbitrary.
- **Collective blocks Multiple Meeting Locations** — arbitrary. Lifted 2026-04-26 — Collective/Mixed location is shared across the team regardless of who's assigned, so offering bookers a list (e.g. "Studio A or Studio B?") is meaningful.
- **Collective blocks Ask the Booker** — arbitrary; collective hosts share one location anyway, so the booker can pick the meeting venue ("come to my office") just like any other shape. Lifted 2026-04-26.
- **Round Robin "only if 1 member" gates** on Ask the Booker, Multiple Locations — arbitrary, can collect from booker then route.
- **External Sync is Event-only** — no obvious reason. Lift.

### C. Genuinely tricky combinations — need an explicit product call
*(combos that were impossible before and need a defined behaviour)*
- ~~**Recurring + Round Robin (multi-staff)**~~ — deferred (recurring out of this release)
- ~~**Recurring + Collective**~~ — deferred (recurring out of this release)
- ~~**Recurring + Seats per class > 1**~~ — deferred (recurring out of this release)
- ~~**Allow Staff Selection + rotation**~~ — **resolved**: when "Allow Staff Selection" is on, the booker sees a host dropdown and can pick any host for *that booking only*. The next booking auto-assigns via rotation; if the next booker also picks someone specifically, that pick is honoured. Manual picks don't change the toggle state; rotation continues normally. Setting is only available when host count > 1 with rotate strategy (structural).

## Edge cases ledger

Running notes on every tricky combination surfaced in the discussion. Each entry: the combo, the question, and the resolution (or "open").

### 1. Allow Staff Selection + rotation
**Q:** When booker is allowed to pick a host on a Round Robin calendar, does the pick override rotation permanently, count toward load balancing, or just apply to that booking?
**Resolved:** Pick applies to *that booking only*. Next booking auto-assigns via rotation; if next booker also picks, that pick is honoured. Toggle state never changes from a pick. Setting is only available with multi-host + rotate (structural).

### 2. Recurring + Round Robin (multi-staff)
**Q:** Same host every occurrence, or rotate per occurrence?
**Resolved:** Deferred — recurring stays as today (Round Robin recurring only allowed with 1 member). Expanding it would require free-slots API changes, picked up in a follow-up release.

### 3. Recurring + Collective
**Q:** Book future occurrences only when all mandatory staff are free, or skip the conflicting ones?
**Resolved:** Deferred — collective recurring stays unsupported as today.

### 4. Recurring + Seats per class > 1
**Q:** Per-occurrence capacity, or one shared roster across the series?
**Resolved:** Deferred — same reason.

### 5. Round Robin with group seats > 1 (formerly impossible)
**Q:** What's this called and how does it behave?
**Resolved (final, 2026-04-26):** **Not allowed.** Class shape (shared + seats > 1) is restricted to 1-host or shared-attending strategy (Collective/Mixed) per locked decision #58. The Group session capacity card is disabled when the calendar is multi-host + rotate strategy, with inline fix-its: switch the strategy to "All members attend" (one-click) or manage hosts on Staff & assignment.

**History:** went through three designs over 2026-04-26 — first "parallel classes per host with rotation overflow" (overengineered), then "single class per slot with rotation picking the teacher" (better but still novel), finally "not supported" after research showed ClassPass / Mindbody / Vagaro all model class slots as one named instructor. Supports the merged-calendar promise without inventing a non-standard config concept.

### 6. 1:1 with seats > 1 (was Class)
**Q:** What's the label?
**Resolved:** **Class Booking** — when shared/group toggle is on. The "Class" name customers know is preserved.

### 7. Mixed mode (strategy = mixed, partial requiredCount)
**Q:** Is this a real concept on the tile menu, or only reachable by tweaking?
**Resolved:** Collapses to **Collective Booking** — no separate "Mixed" label exposed to the customer.

### 8. Group / shared appointment vs. Max Bookings per slot
**Q:** Both control "per-slot capacity" in some sense — are they one setting or two?
**Resolved:** **Two separate settings.** Group/shared = one appointment with multiple attendees (Class). Max bookings per slot = independent parallel appointments running concurrently. Only the shared toggle flips the derived label to Class.

### 9. Class Booking + multi-host rotation — what happens when John's class fills?
**Q:** When John's Tue 10am class hits capacity, does the slot close, or does the next booker spawn a parallel class with Marie?
**Resolved (final, 2026-04-26):** **Question is moot — multi-host rotate + Class isn't supported** (locked decision #58). Group session card is disabled in the Capacity picker when the calendar is multi-host + rotate strategy. Studios that need multiple instructors at the same hour create separate calendars per instructor (the Mindbody / Vagaro / ClassPass-aligned workaround).

**For supported Class shapes:**
- **1 host + Class:** classic single-instructor class. Slot fills at N, no fallback.
- **Collective + Class:** all hosts attend the same shared session (e.g. webinar with multiple presenters in front of a 50-seat audience). Slot fills at N.
- **Mixed + Class:** required hosts attend, plus one rotating-pool member; same shared session. Slot fills at N.

**rotationOptimization** still applies for non-Class multi-host rotate calendars (Single booking and Parallel bookings) — picks which host gets the next booking per usual round-robin logic.

### 10. Widget Type — Classic vs Neo
**Q:** Classic doesn't render group seats today; investing or fallback?
**Resolved:** **Build group-seat support into Classic.** Classic isn't being deprecated, ~40% of users are on it, and the UI lift is small. Both widgets reach feature parity — widget choice becomes pure presentation, not a capability gate.

### 11. Assign Contacts on Event (0 hosts)
**Q:** Where does the contact go if there's no host to assign to?
**Resolved:** Setting is **hidden** when hosts = 0. No assignment in Event-shaped calendars.

### 12. Migration display — labels for existing customers
**Q:** Do we show "Migrated from X" tooltips or banners on the calendar list?
**Resolved:** No. Nothing renames — legacy labels are preserved in the merged world, so there's nothing to explain.

### 13. Service Booking
**Q:** Is it part of the merge?
**Resolved:** No — out of scope. Deprecated entirely, customers move to Services v2.

### 14. Meeting distribution / Priority / Contact routing — RR-only today
**Q:** Stay RR-only or extend to other multi-host configs?
**Resolved:** Extend where they make sense; don't force-fit elsewhere.
- **Meeting distribution** (Maximise availability / Equal distribution) — extends to **mixed** (rotating pool only); doesn't apply to collective (everyone attends, no distribution choice).
- **Host priority** — sub-setting of availability mode; same scope (**rotate + mixed**).
- **Contact routing preferences** — stays **rotate-only**. Doesn't apply to Collective or Mixed because those configs don't have a routing decision to make for new appointments / reschedules — the team or required set always attends.

### 17. Mixed mode default — auto-mark first staff as required
**Q:** When user picks Mixed strategy, what's the default member-role state? (Currently they have to explicitly mark required vs rotating, which can leave Mixed with 0 required = looks like Rotate.)
**Resolved:** When Mixed is first selected, **auto-mark the first team member as Required** and all others as Rotating. User can then re-assign as needed. Eliminates the "Mixed with 0 required" weird state without auto-collapsing the strategy.

### 18. Recurring + adding a 2nd host on RR — warn and disable
**Q:** Existing RR calendar with 1 member + recurring on. User adds a 2nd member. What happens?
**Resolved:** **Warn and disable.** When the user adds a 2nd host while recurring is enabled, recurring auto-disables and an inline warning explains why ("Recurring works only with a single host today. We've turned it off — turn it back on if you go back to one host."). User can save or revert.

### 19. Owner auto-promotion
**Q:** What happens when the Primary owner is removed (or de-required in Mixed)?
**Resolved:** **Auto-promote.** The next eligible member (next in `teamMembers` order, filtered to required for Mixed) automatically becomes the new owner. UI updates to show the new owner highlighted. No silent state where no one is owner.

### 22. Multi-duration (booker picks from N duration options)
**Q:** Today's "multiple durations" capability is being added; does it work for all calendar types?
**Resolved:** **Lifted to Personal, Round Robin, Collective, Mixed, Event** (5 of 6). **NOT supported on Class shape (shared + seats > 1)** — see decision below for why.

**Sub-decisions:**
- **Existing calendars auto-migrate quietly** to a "1 duration option" form. No banner, no prompt.
- **All other rules apply identically across durations** — same form, same payments, same notifications, same buffers, same staff assignment. Only the meeting length changes.
- **Calendar-level fields (Min scheduling notice, Date range, etc.) are shared across all durations.** Not per-duration.
- **Recurring locks the duration at booking time.** Each occurrence in a recurring series uses the same duration the original booker picked. (Recurring itself is deferred to a follow-up release; this rule applies when it returns.)
- **Class shape excludes multi-duration (revised 2026-04-26).** When the calendar is Class-shaped (shared + seats > 1), multi-duration is disabled. The default duration (first in the list) is used; additional durations are paused (preserved per stale-data policy #16, not deleted) and the duration list shows a notice: *"Class uses one duration. Multiple durations aren't supported for shared sessions — the others are paused. Switch to a non-shared shape to use them."* **Why:** earlier draft tried to support multi-duration on Class via "each duration creates its own slot scope", but that was overengineered for the same reason as the parallel-classes design (edge case #9): real class-booking platforms don't do it. A yoga studio offering "Vinyasa 60min" and "Yin 75min" creates separate calendars for each, not one calendar with two durations.
- **Class + multi-host + multi-duration** — n/a, Class shape excludes multi-duration entirely.

### 24. Capacity per slot — semantics depend on strategy + behavior
**Q:** When a calendar has multiple hosts, what does the "capacity per slot" number mean? And does Parallel slots even apply for Collective / Mixed?

**Resolved:**

| Strategy | Behavior | What the input means | Total per slot |
|---|---|---|---|
| Single host | Group session | Group capacity (attendees per session) | N |
| Single host | Parallel slots | Max parallel bookings per slot | N |
| Multi-host **Rotate** | Group session | ❌ **Disabled** (locked decision #58) — Class with rotating hosts isn't supported. Card surfaces inline fix-its: switch strategy to "All members attend" or reduce hosts. | n/a |
| Multi-host **Rotate** | Parallel slots | Max parallel bookings per host | **N × hosts** |
| Multi-host **Collective** | Group session | Total attendees per session — all hosts share one class | **N** |
| Multi-host **Collective** | Parallel slots | ❌ **Hidden** — collective hosts can't parallelise (all required for each booking) | n/a |
| Multi-host **Mixed** | Group session | Total attendees per session — required + 1 rotating share one class | **N** |
| Multi-host **Mixed** | Parallel slots | ❌ **Hidden** — required hosts can't parallelise | n/a |

**Implementation notes:**
- **Multi-host Rotate + Group session (revised 2026-04-26):** capacity is **N total per slot**, NOT N × hosts. Each slot has one class with one host (rotation picks the teacher). The previous parallel-classes-per-host design (capacity N × hosts) is retired — see edge case #9 for the rationale.
- For Collective / Mixed (multi-host) with seats > 1, behavior **auto-forces to `shared`** and the Parallel slots radio is hidden. The remaining "Group session" radio shows context-specific copy ("All N hosts present for each session").
- Capacity total summary copy varies by shape — *"Up to N attendees per slot — rotation picks which host teaches each slot."* (multi-host rotate group), *"N hosts in one shared class — up to N attendees per slot"* (collective), etc.

### 27. "Send custom form to guests" lives with the form picker
**Q:** Where should "Send the custom form to each guest" live?
**Resolved:** It belongs in **Form & confirmation**, right under the form selector — but only visible when **(a) Guests is enabled (in Booking rules → Capacity) AND (b) the selected form is a custom form**. If those preconditions aren't met, the option is hidden. Eliminates the noise of having form-related sub-options buried inside Capacity, while keeping it discoverable in context (right next to the form picker).

### 26. "Add guests" lives with capacity (not in the form section)
**Q:** Where does the "Allow bookers to add guests" setting belong, and how does it interact with capacity?
**Resolved:** Move the setting from Form & confirmation → **Booking rules → Capacity**. It's structurally tied to capacity because the seat-count semantics differ by calendar shape:

- **Class Booking (shared, seats > 1):** **Each guest counts as a seat against capacity.** A booker bringing 3 guests = 4 seats consumed. Visible inline copy: *"A booker bringing 3 guests = 4 seats from your capacity."*
- **All other shapes (Personal, RR, Collective, Mixed without group seats):** Guests are added to the appointment without taking an extra slot. They're just "+1s". Visible inline copy: *"Guests are added to the appointment without taking an extra slot."*

The toggle is always available; the helper text morphs based on shape. Sub-options (name & email vs count only, send form to guests, require at least one guest) appear when the toggle is on.

### 25. Strategy default when going multi-host
**Q:** When the user adds a 2nd team member to a 1-host calendar, what's the default strategy?
**Resolved:** **Auto-default to rotate (Round Robin).** Most common multi-host case. User can switch to Collective or Mixed afterward. Eliminates the "no strategy yet" intermediate state where the live indicator was projecting a default the user hadn't actually picked.

### 23. Recurring constraint reaffirmed
**Q:** What's the recurring scope post-merge?
**Resolved:** **Recurring works with 1 host only**, today and post-merge (until the recurring API rework lands as a follow-up release). Locked decisions 10 and 18 already cover this; reaffirmed here for the PRD.

### 21. Allow Staff Selection on Class + multi-host
**Q:** Today's "Allow Staff Selection" is RR-only. With multi-host Class (parallel classes), should bookers be able to pick which instructor's class they join?
**Resolved:** **Yes — keep Allow Staff Selection available for any multi-host + rotate calendar, including Class.** Default OFF, user opts in. UX impact:
- *Off:* Booker sees "Tue 10pm available" → system silently routes (rotation picks).
- *On:* Booker sees "Tue 10pm with John" and "Tue 10pm with Marie" as separately selectable options.

Use cases driving this for Class: yoga / fitness studios, language schools, personal training — bookers commonly have instructor preferences.

### 20. "Always book with assigned user" — orphan contact fallback
**Q:** Contact has an assigned user, but that user isn't on this calendar. What happens?
**Resolved:** **Fall back to default rotation.** The "Always book with assigned user" toggle only takes effect when the assigned user is actually on the calendar's host list. Otherwise the calendar's normal assignment logic applies. (No hard error, no manual override.)

### 16. Mixed mode location — shared or per-host?
**Q:** In Mixed (some required + others rotate), do rotating-pool members keep their own individual locations, or share the calendar's location like Collective?
**Resolved:** **Shared location for all hosts**, just like Collective. The rotating-pool member who's assigned to a booking joins the shared meeting (Zoom link / address / phone). Rotating-pool members no longer carry an individual location in Mixed. The shared location's "Video call" option lists every connected video tool from every team member (e.g. "John's Zoom", "Marie's Google Meet") so the user picks which account hosts the link.

### 15. Primary owner for Collective and Mixed
**Q:** When everyone (or a required subset) always attends, who "owns" the booking and gets the contact assigned to them?
**Resolved:** A **Primary owner** picker appears for Collective and Mixed.
- For **Collective**: any team member can be picked as owner. Default = first member.
- For **Mixed**: owner must be one of the required attendees (rotating-pool members are not eligible).
- The owner gets the contact assignment (per Assign Contacts logic). Other required members are added as **followers**.
- Replaces the contact routing preferences for these strategies (which don't apply).

## Class Booking parking lot — mostly resolved by simplification (2026-04-26)

These were Class-specific design questions deferred for later. The 2026-04-26 simplification (locked decisions #55, #56) — retiring the parallel-classes design and excluding multi-duration from Class — collapsed most of them.

- ~~**Class booker widget — UX for parallel-classes view.**~~ **Resolved:** parallel-classes design retired. Booker sees a single class per slot (one instructor, N seats). No comparison view needed.
- ~~**Class + multi-duration booker flow.**~~ **Resolved:** multi-duration is excluded from Class shape. Question is moot.
- ~~**Class + multi-host + Allow Staff Selection ON — parallel-tile UI.**~~ **Resolved:** with the simpler model, Allow Staff Selection on Class becomes "filter slots by preferred instructor" (deferred enhancement) rather than a parallel-tile picker. Locked decision #21 keeps it Rotate-only for now.
- ~~**Class + Always book with assigned user.**~~ **Resolved:** standard rule applies — book with assigned user if their slot has capacity, else fall back to rotation (locked decision #20).
- ~~**Capacity display when shared + multi-host.**~~ **Resolved:** single-instructor model means "5 seats left" works the same way as single-host Class. No per-class vs aggregate question.
- ~~**Show seats per slot UI on Class.**~~ **Resolved:** same UI as single-host Class. The toggle (`showSeatsToBookers`) lives inside the Group session card.
- **Help-doc edge cases for Class** — still pending. Smaller scope now: explain the rotation-picks-teacher model, multi-duration exclusion, capacity math (N total per slot, not N × hosts), and the "for parallel-instructor classes, create separate calendars" workaround.

## Engineering notes (track during implementation)

Things that aren't pure product decisions but matter for the build:

- **Classic widget gets group-seat support** — committed product decision (locked decision #11). Engineering owns the build; needs scoping. Until shipped, calendars in Class shape on Classic widget will fall back gracefully (TBD: warn at save time?).
- **Data migration** — existing calendars need their `_oldType` mapped to the new merged schema. Each legacy type maps to a default `(strategy, seatsPerSlot, bookingBehavior)` triple. Spec the mapping table before implementation.
- **Free-slots API** — recurring expansion explicitly deferred (locked decision #10). Don't touch the free-slots API in this release.
- **Analytics events** — keep internal `type` field for analytics (locked decision #1). Add events for new combos (parallel-class spawn, multi-host group session creation, multi-duration selection).
- **A/B test gating** — feature flag the merged editor experience. Existing calendars under the legacy editor by default; new calendars + opted-in users get the merged flow.
- **Helper text consistency** — single string-table pass. Search-and-replace any legacy "Personal Booking / Round Robin / etc." strings outside the derived-label rules.

## Edge cases / gaps still open

> **Most of these are now resolved.** Kept here for archival; live open items live in **"Open issues — TODO for next session"** below.

- ~~Naming for "rotate + seats > 1"~~ — resolved as Class Booking (edge case #5).
- ~~Naming for "1:1 + seats > 1"~~ — resolved as Class Booking (edge case #6).
- ~~Mixed mode: real concept on tile menu?~~ — resolved (collapses to Collective Booking, locked decision #6; no separate Mixed tile).
- **Booker widget changes for new combos** — partly done; needs to reflect new `locationMode`. See Open issues below.
- ~~What existing customers see Monday morning post-launch~~ — resolved (locked decision #11: no migration UI).
- ~~"Migrated from X" tooltip~~ — resolved (locked decision #12: no).
- ~~AI setup copy~~ — resolved (locked decision #12: reuse existing UI as-is).

## Locked decisions — added in Session 2 (2026-04-25 UI sweep)

20. **Capacity per slot — behaviour radio first, number second.** On the Booking Rules tab, the "How should multiple bookings work?" radio (Parallel slots / Group session) is rendered **above** the capacity number, not gated on capacity > 1. Picking the behaviour drives the capacity field's label and helper. **Why:** the natural mental model is *pick what you want, then set the number*. The previous order forced users to bump capacity blindly to discover what was possible.

21. **Mixed with single rotating host — hide all routing knobs.** When `strategy === 'mixed'` and the rotating pool has ≤ 1 member, the entire **Advanced routing rules** expander is hidden (no Distribution algorithm, no Host priority, no "Let booker choose host"). **Why:** there's no routing decision to make — the lone rotating host always handles rotation, no one to compare them against.

22. **"Distribution algorithm" → "How to pick a host".** Less technical. Subtitle reads *"When several hosts are available for the same slot."*

23. **"Let booker choose their host" — Rotate-only.** This setting is restricted to `strategy === 'rotate'`. **Why:** for Collective everyone attends; for Mixed required attendees always attend and the rotating pool is auto-routed — booker has no host to pick in either case.

24. **Booker location options — single mode picker, four mutually exclusive modes.** Replaces both per-host inline location dropdowns AND the standalone multi-location/ask-booker toggles. The new Meeting Location card has one radio:
    - `per_host` — each host's own location (visible only with 2+ hosts)
    - `single` — one calendar-wide location (default for Personal)
    - `multiple` — list of options the booker picks from
    - `ask_booker` — booker provides their own
    
    **Why:** previous design had per-host dropdowns *and* calendar-level toggles for the same concept — two parallel UIs for "where does this meeting happen". Now there's one decision and the sub-UI morphs.
    
    **Schema impact:** new field `locationMode: 'per_host' | 'single' | 'multiple' | 'ask_booker'`. Removed `allowMultipleLocations` and `askBookerForLocation` (folded into the mode).

25. **Per-host inline location dropdowns moved out of team-member rows.** Team member rows now show name + remove only. The per-host editor (each member with their location dropdown) lives inside the Meeting Location card, under the `per_host` mode's expanded sub-UI. **Why:** keeps location concerns in one place; team-member rows stay scannable.

26. **Personal calendar default `locationMode = 'single'`.** Single-host calendars don't render the `per_host` radio, so a watch effect auto-corrects `per_host` → `single` whenever team count drops to 1. Default for the new "single" mode is Zoom.

27. **Wizard sidebar shows completion signal.** Each tab in the wizard shows a green ✓ when "complete enough" (Basic details: name set; Staff: at least one host or strategy chosen; Rules: duration > 0; Form: form picked). Tabs that need attention show an amber dot. The Save button greys out when the calendar has no name.

28. **Top bar — "+ New Appointment" removed from global app shell.** The wizard's own header (Back · calendar name · Show Preview · Save changes) is the only top bar.

29. **Calendar widget style (Neo / Classic) is a first-class control in Widget appearance.** Customize sub-section is gated to Neo (Classic shows an amber "Only works with Neo widget" pill but stays selectable). Reflects the locked decision that both widgets reach feature parity at the calendar level.

30. **Strategy cards stay clean.** Rejected an early experiment to add a "Sets type to Round Robin / Collective Booking" pill on each strategy card — Swadha called it noise. The chip at the top of the wizard already shows the live derived label.

31. **Meeting Location IA — single card, no mode picker.** Replaces the 4-mode radio (per_host / single / multiple / ask_booker) AND the parallel `LocationPicker.vue` for Event/Collective/Mixed with a single shape-aware Meeting Location card. **Why:** the old design forced users to pre-pick a "location strategy mode" before answering the actual question ("where?"). It also had two parallel UIs for the same concept, violating the no-parallel-UIs rule. **How it works per shape:**
    - **0 hosts (Event):** one Location dropdown showing the **full 7-option menu** (Zoom / Google Meet / MS Teams / Phone / Full address / Custom / Ask the booker). Video tools are disabled with `(no team member to host the link)` because there's no host; everything else is enabled. "+ Add another option" available.
    - **1 host (Personal, 1-host RR, 1-host Class):** one Location dropdown showing the **full 7-option menu**, pre-filled with host's primary video tool. Video tools the host hasn't connected are disabled with `(not connected)`; the rest are enabled. "+ Add another option" available.
    - **Multi-host RR / multi-host Class:** **inline per-host dropdown next to each team-member row** (no separate Meeting Location card). Each row = avatar + host name + location dropdown + remove. Dropdown shows **the full menu of every possible option** — Zoom / Google Meet / MS Teams / Custom / Phone / Address / Ask the booker — with each entry independently enabled or disabled based on whether it's available for that host & shape: video tools the host hasn't connected are disabled with `(not connected)` suffix; "Ask the booker" is disabled with a tooltip explaining it's not supported with multiple rotating hosts. **General principle:** every dropdown across the wizard should show the complete option set, just enabled or disabled per the current configuration — never silently omit. (Matches today's prod pattern.)
    - **Collective / Mixed:** one shared Location dropdown showing the **full 7-option menu** (Zoom / Google Meet / MS Teams / Phone / Full address / Custom / Ask the booker). Video tools are enabled when at least one *eligible* member has them connected (eligible = all members for Collective, required attendees only for Mixed) and disabled otherwise with an explanatory tooltip. After selection of a video tool, a **"Hosted by" indicator** always shows beneath: a static label when only one eligible member has the tool (`Hosted by Swadha (only required member with Zoom)`), a dropdown when 2+ eligible members have it. **Multi-location supported.**

    **Amends Session-2 decision #25:** Per-host inline location dropdowns return to team-member rows for the multi-host RR/Class case. The original move (out of rows, into a per_host mode in the Meeting Location card) was correct when location had multiple modes (per_host vs single vs multiple vs ask_booker) — keeping the location concern in one card simplified the picker. Now that the mode picker is gone and per-host is the *only* shape for multi-host RR/Class, putting the dropdown directly next to the host name is more direct: one row per host, one decision per row, no separate card needed for what's already a per-host concern.

32. **Ask-the-booker is a Location dropdown option, not a mode.** It sits inline with Custom / Phone / Address. Removed as a top-level radio. **Why:** it's a single answer to the same "where?" question, not a separate decision the user makes upfront.

33. **Multi-location restricted from multi-host RR / non-shared Class only.** "+ Add another option" renders for: 0 host (Event), 1 host (Personal / 1-host RR / 1-host Class), Collective, Mixed. **Why:** for multi-host *rotation* shapes, the host's location is the location — multi-location creates a "booker picks Zoom, but the assigned host doesn't have Zoom" failure mode. For Collective/Mixed the location is shared across the team regardless of which rotating-pool member ends up routed in, so offering the booker a list (e.g. "Studio A or Studio B?", "Zoom or in-person?") is meaningful — every option works for the whole attending set. (Earlier draft restricted Collective/Mixed too; reversed 2026-04-26 once it became clear the rotation concern doesn't apply when everyone attends.)

34. **Ask-the-booker scoped to {0/1 host, Collective, Mixed}.** Hidden on multi-host RR/Class. **Why:** in rotation we don't know which host will be assigned, so we can't promise the booker's chosen venue will work for them. Collective/Mixed is fine because everyone attends one shared meeting.

35. **Per-host shared-location escape hatch deferred.** A "use one shared location for all rotated hosts" option on multi-host RR/Class was considered but pushed to a follow-up. Today, multi-host non-shared = per-host only. **Why:** rotating-model is *about* host independence; if a team needs shared location, Collective is the right shape. Revisit later if it becomes a real ask.

36. **Inline hint pattern for gated features.** When a feature is hidden because of the current shape (e.g. "Ask the booker" hidden on multi-host RR; "Multiple locations" hidden on Collective), don't vanish silently — leave a small inline hint where the control would have been: *"Looking for X? Try Y."* Plain copy pointing at the gating toggle. Mirrors the Recurring helper. **Why:** preserves discoverability for power users without showing a dead control.

37. **Location is recommended, not required.** Save is **not** gated on location — bookers can technically book without one (a meeting still goes on the calendar without a venue). But the Location field is presented as important: amber sidebar dot on Staff & assignment until set, soft inline note (*"Add a location so bookers know where to meet — most calendars use this."*), live preview chip showing what bookers will see. **Why:** earlier draft hard-gated Save (decision #37 v1), but Swadha pointed out that bookings don't actually fail without a location — it's a UX nudge, not a blocker. Hard-gating discoverable settings is heavy-handed; nudging keeps the friction proportional to the consequence.

38. **Auto-fill Location on first host add.** When the first team member is added, default Location to their primary video tool (Zoom > Google Meet > Teams in connected order). Falls back to Custom if no integration. **Why:** new users never land on an empty Location field; smart-default eliminates the most common skip path.

39. **Live preview chip below the Location dropdown.** Shows what the booker will actually see — e.g. *"Bookers will see: Zoom link auto-generated with John's account"* / *"Bookers will see: a text field to type their preferred location"* / *"Bookers will see: 3 location options to choose from."* **Why:** closes the mental gap between configuration and end-customer experience.

40. **Shared-location sub-picker for "whose account hosts the link" (Collective / Mixed).** After the user picks a video-tool category (Zoom / Google Meet / MS Teams) on a Collective or Mixed calendar, an inline "Hosted by" sub-picker shows only when **2+ eligible team members** have that tool connected. The picker lists **all required/mandatory members with the tool** — Collective = every team member (since all are required), Mixed = required attendees only (rotating-pool members aren't a stable host for the link). Auto-defaults to the **owner** if eligible, otherwise the first eligible member. The owner is the *default* — not the only choice; user can pick any other required member as the link host. **Why:** the original design listed every (member × tool) flat in the dropdown (`"John's Zoom" / "John's Meet" / "Marie's Zoom" / …`). At 50 hosts × 3 tools that's 150 options — unscannable. Categories first, source second scales to any team size.

42. **Mixed must keep at least one Required member.** The Rotating button on the *last* required member is disabled with tooltip *"At least one member must be required for Mixed — switch the strategy if you want everyone to rotate."* **Why:** zero required + everyone rotating is functionally Round Robin, but Mixed still surfaces shared-location semantics ("everyone shares one Zoom") which RR doesn't. Allowing the all-rotating state created a contradictory config — a routed-host calendar where the location was a single shared link.

44. **Event Calendar always wins on 0 hosts** (rule reorder above). Eliminates the "host-less Class Booking" weird state — a Class needs a host to run the session, and 0 hosts trivially means it's an Event. Event template, host-less custom calendars, and the host-removal edge case all derive cleanly as Event Calendar regardless of `seats` / `behavior`.

45. **`assignmentStrategy` resets to `null` when host count drops below 2.** Going from 2+ → 1 host clears the strategy field — strategy is meaningless with one host. Same for going to 0. **Why:** a Collective-flagged calendar with 1 host was still carrying `strategy === 'collective'` internally, surfacing nowhere in the UI but persisting stale state. Cleaner to clear it at the transition.

46. **Recurring + multi-host: confirm before disabling, not silently after.** When the user adds a 2nd host while recurring is enabled, surface a confirm modal *before* the host is added: *"Recurring meetings only work with one host today. Adding a second host will turn off recurring. Continue?"* with **Continue** / **Cancel**. Only on Continue does the host get added and recurring auto-disable. Replaces the previous post-fact toast (which was easy to miss). **Why:** recurring is a load-bearing setting; users editing existing calendars need to know the consequence before the change happens, not after.

47. **Mixed with all-required → save as Collective; Mixed with all-rotating → save as Round Robin.** Both endpoints of the Mixed strategy auto-normalize on save to the equivalent simpler strategy. Mirrors the principle: Mixed is meaningful only when it's *actually* mixed (1+ required AND 1+ rotating). The two collapse cases:
    - **All members required** (zero rotating): persists as `strategy = 'collective'`, clears `requiredAttendeeIds`. SmartTip during edit: *"All members are required — this saves as Collective Booking."*
    - **All members rotating** (zero required): persists as `strategy = 'rotate'`, clears `requiredAttendeeIds`. SmartTip during edit: *"All members are rotating — this saves as Round Robin."*
    
    **Why:** Mixed with 0 rotating = Collective behaviorally (everyone attends). Mixed with 0 required = Round Robin behaviorally (no one fixed, all rotate). Carrying either as `strategy='mixed'` is a phantom distinction that confuses analytics, breaks routing UI, and surfaces "you have 0 X members" warnings on every load. Collapse-on-save normalizes the state, and the user didn't actively pick "required" so we shouldn't auto-mark someone as required to fake-keep Mixed alive (Swadha's call: respect what the user actually chose). Decision #42 still locks the *toggle* so the user can't demote the last required member, but if they reach 0 required by *removing* a member, we collapse on save instead of fighting it.

50. **Behavior radio stays hidden for Collective/Mixed at any seat count, but the notice copy splits at seats=1 vs seats > 1.** With Collective or Mixed (multi-host), the user can't pick Parallel slots (hosts would clash), so the radio is replaced with a grey notice. **At seats=1**, the notice describes a single shared booking — *"All N hosts attend the same booking."* / *"Required hosts always attend the same booking."* — without the "group session" framing (which doesn't apply yet). **At seats > 1**, the notice gains the group framing — *"All N hosts attend every session — runs as a single shared group session of up to X attendees."* The behavior auto-force watcher continues to apply only when seats > 1, so seats=1 stays as `bookingBehavior = 'separate'` (a single booking with everyone attending = same outcome anyway).

52. **Capacity-per-slot redesigned as 3 outcome cards in order Single → Parallel → Group.** Replaces the `behavior radio (Parallel / Group)` + `seats input` + `auto-bump` pattern. The three cards (in display order):
    - **👤 Single booking** — `seats=1, behavior=separate`. Number is implicit (always 1). Renamed from "Solo" because with multi-host rotate the slot can fill multiple times (one per host) — calling it "solo" misled. Description morphs by shape: *"One booker per slot. One meeting."* (single host) / *"One booking per host, per slot. Each of your 3 hosts can take one booking at the same time."* (multi-host rotate) / *"One booking per slot. All hosts attend."* (collective/mixed).
    - **⚡ Parallel bookings** — `seats=N, behavior=separate, seats > 1`. Capacity number labelled *"Separate meetings per slot"* (or *"per host, per slot"* multi-host) lives inside the card. Description: *"Multiple separate meetings can happen in the same slot — each its own booking, with its own attendees."*
    - **👥 Group session** — `seats=N, behavior=shared`. Capacity labelled *"Attendees per session"* + "Show seats remaining" checkbox live inside the card. Description morphs by shape: *"Multiple bookers join one shared meeting with the host."* (single host) / *"Each host runs their own group session for the slot…"* (multi-host rotate) / *"Multiple bookers join one shared meeting. All hosts attend together."* (collective).
    
    For Collective/Mixed (multi-host), the Parallel card is **disabled** with tooltip *"Parallel bookings aren't possible when all hosts attend every booking. Switch the strategy to 'Rotate between members' to enable."* Solo and Group remain selectable. The previous auto-force watcher (Collective + seats > 1 → shared) is removed — user picks explicitly. **Why:** the old design asked the user to mentally compose `(behavior × seats)` to predict the outcome. The cards make outcome the primary decision; the math sits inside the chosen outcome.
    
    Card-to-state derivation (used to highlight which card is currently selected): `seats === 1 → Solo` (regardless of behavior — they collapse). `seats > 1 && shared → Group`. `seats > 1 && separate → Parallel`. Switching cards updates `seats` to a sensible default for that card if needed (Group default 5, Parallel default 3).

53. **Guests promoted to its own sibling card with sharper per-shape copy.** Removed from inside the Capacity card; now a separate card titled "Guests" with its own heading and lead copy. The shape-aware explanation block was sharpened to communicate the *outcome* in plain English:
    - **Single booking:** *"Guests are add-ons — they come along with the booker. They don't take a separate slot or affect availability."* + booker preview *"Guests are listed on the appointment but don't affect slot count."*
    - **Parallel bookings:** *"Each parallel booking can include its own guests. Guests are add-ons — they don't fill an extra slot. Your capacity counts independent bookings, not total people."* + booker preview *"Each parallel booking can have its own group of guests; nobody else loses a slot."*
    - **Group session:** *"Each guest takes one seat from your group of N. A booker bringing 3 guests fills 4 of those seats — leaving N−4 for other bookers."* + booker preview *"Each guest reduces seats remaining in this group."*
    
    **Why:** the guests toggle has fundamentally different semantics per shape (Group: each guest = a seat; Single/Parallel: guests are add-ons). The earlier copy was too generic — *"join the meeting alongside the booker"* didn't communicate that Parallel-shape guests are bound to the *specific* parallel booking they came with, not a global pool.

55. ~~**Multi-host rotate + Class = single class per slot, rotation picks the teacher.**~~ **Superseded by #58.** The simplified model (rotation picks teacher per slot) was a step in the right direction, but follow-up research on ClassPass / Mindbody / Vagaro confirmed that the *configuration concept* "multi-host rotate + Class" exists nowhere in the prior art — all three model class slots as one named instructor, with rotation handled by per-occurrence assignment or eligible-staff lists, not by a "rotate the host" calendar setting. Decision #58 restricts Class to 1-host or shared-attending (Collective/Mixed) to match industry convention. Kept here for archival.

56. **Multi-duration disabled on Class shape, with loud preservation copy.** When the calendar becomes Class-shaped (shared + seats > 1), the multi-duration list shows a notice: *"Class uses one duration. Multiple durations aren't supported for shared sessions — the others are paused. Switch to a non-shared shape to use them."* The additional durations are **preserved, not deleted** (per stale-data policy #16) — switching back to a non-shared shape brings them back. **Why:** silent overrides feel like data loss. Loud copy makes the model legible: user knows what's happening, what's preserved, and how to get back.

60. **Service Booking calendars — separation, not deletion.** "+ New calendar" never creates a Service Booking calendar (the merged editor doesn't expose Service Booking as a configurable shape; it's out of scope per locked decision #2). **Existing Service Booking calendars are moved to a separate tab** in the calendar list — same pattern used when Services v2 launched and the v1 service calendars were segregated to their own tab. Bookers can still access existing service calendars via direct links until the customer migrates them to Services v2; no UI on the merged editor lets users create new ones.

61. **AI setup assistant — proposed flow under merged calendar (working draft).** Today's AI setup is type-bound (asks user intent, picks one of 5 legacy types, asks limited follow-ups). Doesn't model Mixed. Carries each type's legacy restrictions. Needs streamlining post-merge:
    
    **Stage 1 — Intent capture:** User types a free-form intent (e.g. *"I want to schedule yoga classes for my studio, 60-min sessions with up to 10 students"*). No type selection upfront.
    
    **Stage 2 — AI inference:** AI parses the intent and surfaces a tentative config in the calendar's *output* dimensions (not legacy types):
    - Calendar name (inferred from intent)
    - Duration (60 min)
    - Capacity & shape (Group session, 10 attendees)
    - Tentative host count if mentioned
    - Tentative payment if mentioned ("$25 a class")
    
    **Stage 3 — Confirmation questions** (1–3 max, only for what wasn't inferred):
    - **"Who hosts?"** — *Just you* / *A specific team member* / *Multiple instructors*
    - **If multiple hosts:** *"How are bookings shared between them?"* with plain-English options: *"Each booking goes to one available instructor"* (rotate) / *"Everyone attends every booking"* (collective) / *"Some always attend, others rotate"* (mixed). The legacy strategy names (*Round Robin / Collective / Mixed*) never appear; AI translates back internally.
    - **"Where will it run?"** — Custom / Address / Phone / Zoom / Google Meet / MS Teams / Ask the booker
    - **"Do you charge for this?"** — only if not implied
    
    **Stage 4 — Plain-English summary + apply:** AI shows the resolved config in plain English, then offers *"Looks good — create"* or *"Edit in the wizard"*. Legacy type labels never surface to the user. Internal `derivedType` resolves automatically from the config (locked decisions #44, #58).
    
    **Edge cases the AI must handle correctly under the merged model:**
    - "Doctor with 3 rooms taking patients simultaneously" → Personal + Parallel bookings, capacity 3
    - "Yoga class for 10 students" → Personal/1-host + Group session, capacity 10 (Class shape)
    - "Sales discovery call rotating between 3 reps" → Round Robin with 3 hosts
    - "Panel interview where everyone attends" → Collective
    - "Account exec always on the call + rotating SDR" → Mixed (1 required + N rotating)
    - "Webinar with multiple presenters and 50 attendees" → Collective + Group session (multi-host shared)
    - "Open community event, no host needed" → Event Calendar (0 hosts)
    
    **What must NOT happen under the new flow:**
    - AI offering *"Round Robin / Class / Collective"* as a top-level type pick (we don't expose types; they're derived).
    - AI generating a multi-host rotate Class config (locked decision #58 disables the combo — AI must steer the user toward "create separate calendars per instructor" or "switch to All members attend" if they describe parallel-instructor classes).
    - AI generating a multi-duration Class (locked decision #56 — paused).
    - AI generating a multi-host calendar with recurring on (decision #46 — modal-confirm pattern, AI should surface the trade-off in plain English).
    
    **Open questions for the AI flow (TBD before AI implementation):**
    - How does the AI handle ambiguous intents ("I want to take meetings with my team")? Probably ask clarifying questions rather than guess.
    - How does the AI surface *"Ask the booker"* and *display label* — only when relevant to the intent?
    - Should the AI offer to set up Form / Notifications / Booking Channels in the same flow, or hand off to the wizard for those?
    
    **Deliverable:** the AI assistant prompt + tool-use schema needs a refresh that maps intent dimensions → unified-calendar config fields directly (no legacy-type intermediate). Engineering owns the prompt; product owns the question taxonomy + plain-English translations.

59. **Display label for in-person locations.** Each `MeetingLocation` of type `in_person` (Custom / Phone / Address) gets an optional `displayLabel` field. **Bookers see the displayLabel pre-confirmation; the actual `customValue` (real address/phone/notes) is only revealed in the booking confirmation email and post-booking screen.** Useful for privacy — e.g., the user labels their location *"Office address"* and the actual street address is only sent after the booking is confirmed. UI: an "Add display label" affordance appears below the value field whenever the location type is `in_person`. Visible in:
    - StaffAssignment per-host inline rows (multi-host RR / non-shared Class)
    - LocationPicker single-location dropdown (1-host, 0-host, Collective, Mixed)
    - LocationPicker multi-location entries
    
    BookerWidgetPreview prefers `displayLabel` over `customValue` in its location text. Also added preview support for: multi-location radio picker (when `locationMode === 'multiple'`), ask-booker text input (when `calendarLocation.type === 'ask_booker'`), guest picker (with shape-aware behaviour — Group reduces visible seats per guest, Single/Parallel keeps slot count flat), and an honest fallback for multi-host rotate (*"Location confirmed once a host is assigned"*).

58. **Class shape requires 1 host OR shared-attending strategy (Collective / Mixed) — NOT multi-host rotate.** When the calendar is multi-host AND `strategy === 'rotate'`, the **Group session** capacity card is disabled. Tooltip: *"Class with rotating hosts isn't supported."* The disabled card surfaces two inline fix-its so the user doesn't have to navigate back:
    - **"Switch to 'All members attend'"** button → one-click sets `assignmentStrategy = 'collective'`, enabling Group session immediately.
    - **"Manage hosts on Staff & assignment →"** link → navigates to Staff & assignment tab where the user can carefully reduce hosts (host removal is data-affecting; better to do it where the host list is visible).
    
    Single-host calendars can be Class. Collective / Mixed multi-host calendars can be Class (e.g. webinars with multiple presenters in front of a 50-seat audience — a real B2B use case). Multi-host *rotate* + Class is the only excluded combination.
    
    **Why:** ClassPass / Mindbody / Vagaro all model class slots as exactly one named instructor. Rotation across instructors happens through per-occurrence scheduling or eligible-staff lists, not a "rotate the host" calendar primitive. Studios that want "5 yoga teachers rotating who teaches Tue 10am" do it by either (a) scheduling separate single-instructor occurrences week-by-week, or (b) creating one calendar per instructor. Our merged-calendar promise doesn't require us to invent a novel pattern that no class platform exposes — and the configuration concept was confusing users.
    
    Supersedes locked decision #55. Edge cases #5 and #9 are now archival.

57. **Loud-not-silent communication of shape-driven setting changes.** General principle: when picking a card or toggling a setting causes downstream features to be paused, capacity math to change, or settings to be auto-flipped, surface the consequence inline at the affected card — never silently. Examples on the wizard right now: multi-duration list notice when Class is active; capacity total summary morphing copy ("rotation picks which host teaches each slot" vs "all hosts in one shared class"); recurring confirm modal before disabling on multi-host (decision #46); Mixed-all-required SmartTip on save behaviour (decision #47). The general pattern: state-aware notices on the affected card, plus a confirm modal for actions that feel data-affecting.

54. **"Single booking" instead of "Solo".** The first capacity card was originally named "Solo meeting" but with multi-host rotate that's misleading — 3 rotating hosts can each take a "solo" booking at the same slot, so 3 meetings happen for what looks like one. "Single booking" describes the per-booking outcome (one booker → one meeting) and is honest about multi-host parallelism happening at the host-distribution level, not the slot-content level.

51. **Add-guests interaction is shape-dependent and surfaced in the UI.** Currently the inline `— each guest takes a seat` / `— guests join without taking a slot` tag exists on the toggle, but isn't loud enough. When Add guests is enabled, the editor shows a contextual explanation block under the toggle, with **shape-aware copy + booker-preview line**:
    - **Class shape (shared, seats > 1):** *"Each guest counts as a seat from your capacity. A booker bringing 3 guests fills 4 of your X seats per session."* + *"Bookers will see: an 'Add guests' picker. Each guest reduces remaining seats."*
    - **Parallel slots (separate, seats ≥ 1):** *"Guests are add-ons — they join the booker's appointment without taking a separate slot. Capacity counts independent bookings, not total people."* + *"Bookers will see: an 'Add guests' picker. Guests come along but don't reduce slot capacity."*
    - **Single booking (1 host, seats=1, separate; or Collective/Mixed seats=1):** *"Guests join the meeting alongside the booker."* + *"Bookers will see: an 'Add guests' picker."*
    
    **Why:** *"Allow bookers to add guests"* sounds harmless, but the same setting has fundamentally different consequences depending on shape — a 10-seat Class with guests on can fill in one booking (1 booker + 9 guests), while a 10-parallel-slot Personal calendar with guests on can fit 10 bookings × any number of guests each. Without explicit copy, users don't see the math.

49. **Capacity stays in Booking rules.** Considered moving capacity (`seatsPerSlot` + behavior radio) into Staff & assignment so it sits next to host count + strategy (which it's coupled with — Collective + seats > 1 auto-forces shared mode). **Decision: keep in Booking rules.** Capacity has meaning even at 0 hosts (Event with N parallel registrations), Booking rules is already the home for booking math (duration/intervals/buffers/max-per-day), and Staff & assignment is already dense. The live derived-label chip + the `totalCapacitySummary` block inside the capacity card already bridge the two concepts visually — moving the field would shuffle without adding information.

48. ~~**Skip the redundancy: auto-bump seats when picking Group session.**~~ **Superseded by #52.** Originally: auto-bumped seats from 1→5 when user clicked the "Group session" radio. The 3-card capacity redesign (#52) absorbed this — the Group card itself sets seats to a sensible default on selection, no more radio. Kept here for archival.

43. **Contact-routing settings have explicit per-action headers.** Inside the "What happens for returning contacts" expander:
    - *"When they reschedule"* — reassign-via-rotation vs. keep-same-owner radios.
    - *"When they book a new appointment"* — "Always book with the contact's assigned user" checkbox.
    
    **Why:** the two settings live next to each other and answer different questions (one is reactive — what happens on a reschedule; one is proactive — what happens on a *new* booking). Without explicit per-action sub-headers, users assumed both governed the same flow.

41. **Owner pick consolidated into role-selection rows (no separate "Primary owner" card).** The standalone Primary-owner picker is removed for both Collective and Mixed. Instead:
    - **Collective:** an inline owner star/badge appears on every team-member row in the Team Members card. One member is owner at a time; clicking another's star transfers ownership.
    - **Mixed:** the owner star appears on each required-member row inside `MemberRoleAssigner` (same row as the Required/Rotating segmented toggle). Only required members are owner-eligible — rotating pool members don't get the star.
    
    **Why:** the previous design had three separate decisions stacked on the same screen (strategy → required-vs-rotating → owner). Three cards = three decision points. Folding owner into the row where role is already being decided cuts to two cards (strategy + roles-with-owner) and pairs the question "is this person required?" with "and are they the owner?" — the natural follow-up. Stays consistent with locked decision #15 (owner constraints — for Mixed, owner must be required). Auto-promotion still applies (decision #19) when an owner is removed or demoted.

## Edge cases — added in Session 2

### 28. Mixed with one rotating host — Advanced routing rules collapses
**Q:** What's left in Advanced routing rules when Mixed has only 1 rotating member?
**Resolved:** Nothing. Distribution algorithm has no choice (one host always picked). Host priority has no list (one member). "Let booker choose their host" doesn't apply (Mixed). The whole expander is hidden — not just empty content.

### 29. Multi-location vs Ask-the-booker — single picker
**Q:** Should "Multiple locations" and "Ask the booker" be independent toggles?
**Resolved:** No — they're modes of one decision. Folded into a single radio with four options (per_host / single / multiple / ask_booker). Previously had them as overlapping toggles with a conflict notice when both were on; that's gone now.

### 30. Per-host inline location dropdowns
**Q:** Where do per-host locations live now that the Meeting Location card exists?
**Resolved:** Inside the Meeting Location card under the `per_host` mode. Removed from team-member rows. Team-member rows are now name + remove only. **Trade-off accepted:** picking host AND their location used to happen in one row; now it's two visual sections. Won out on coherence: location-picking IS one decision.

### 32. Assign-contacts toggle hidden when 0 hosts (Event)
**Q:** Where does the "Assign contacts to team members" toggle live when there's no host to assign to?
**Resolved 2026-04-26:** Hidden. The whole "Additional settings" card in Notifications & Policies (containing Assign contacts + Skip-if-already-assigned) is gated on `teamMembers.length > 0`. Aligns with edge case #11.

### 31. Recurring toggle — multi-host disabled state
**Q:** What does the recurring toggle look like when multi-host blocks it?
**Resolved:** Toggle renders as visually disabled (grey, cursor-not-allowed) with inline helper *"Available with one host only. Remove additional hosts on the Staff & assignment tab to enable recurring."* No silent-off behaviour. (Locked decision #18 already covers the auto-disable on adding a 2nd host; this is just the explanation copy when multi-host arrives via any path.)

## Session 2 — UI/IA implementation log (2026-04-25)

### Chief-of-Product-Design audit findings (initial scan)
Walked the wizard top-to-bottom. Original 14 findings prioritised; Swadha asked for 4, 5, 6, 8, 9, 12, 13 to be implemented:

- **4** — Strategy radio cards: tried adding a derived-label pill ("Sets type to Round Robin"); Swadha rejected as noise. Cards stay clean. (Locked #30.)
- **5** — Tile names no longer leak into the calendar name. `useCalendarState.onSelectTemplate` always sets `name = ''`. Header reads "Create - New Calendar" until user names it. The "+ Group (NEW!!)" mismatch chip on `BookerWidgetPreview` was deleted; the wizard top-bar chip is the single source of truth.
- **6** — Recurring toggle gets a disabled state + helper when multi-host. (Locked #31.)
- **8** — Sidebar completion signals (green ✓ / amber dot) + Save button gating on calendar name. (Locked #27.)
- **9** — Booking URL surfaced as a primary field on Basic details (was buried in More options).
- **12** — Calendar list action icons get fast custom tooltips (Edit / Share link / Embed code / More actions) instead of slow native browser titles.
- **13** — Every wizard tab subtitle rewritten to answer *why visit this tab* (e.g. "Name, URL, and branding — what bookers see at the top of the booking page").

Findings **not implemented** (deferred):
- **1** — Template tile names still mismatch locked decision #5. Tiles read "1:1 Meeting / Group Session / Team Rotation / Panel / Committee / Event"; spec says reuse legacy names "Personal Booking / Round Robin / Class Booking / Collective Booking / Event Calendar". **Open TODO.**
- **3** — Classic vs Neo widget toggle. **Done** as part of the Widget Appearance rebuild later in the session.
- **7** — Copy consistency pass ("Parallel slots" vs "Max parallel bookings" vs ...). Still pending.
- **10** — Service Booking row deprecation visual on calendar list. Still pending.
- **11** — "+ New Appointment" vs "+ New Calendar" button collision. Resolved by removing "+ New Appointment" entirely.
- **14** — Sidebar active-state lag bug. **Engineering bug, not product** — flagged for follow-up.

### Widget Appearance rebuild
Rewrote `WidgetAppearance.vue` to match the reference screenshot Swadha shared: Group view image upload · Neo/Classic radios · "Customize calendar widget" card with Neo-only gating · Primary settings (Primary color / Background color / Button text + Calendar title/description/details toggles) · Reset to default + Preview widget · Insert custom code textarea.

### Top bar cleanup
Removed "+ New Appointment" button from `AppShell.vue`. The global app shell is cleaner; wizard's own header is the only top bar in the calendar flow.

### Booking rules — capacity restructure
"How should multiple bookings work?" radio (Parallel slots / Group session) now sits above the capacity number, always visible (locked #20). Capacity input morphs label based on selection. Added an amber nudge when Group session is picked at seats=1.

### Routing rule cleanup
- Hide Host priority for Mixed when rotating pool ≤ 1 (locked #21 part).
- Renamed "Distribution algorithm" → "How to pick a host" (locked #22).
- Restricted "Let booker choose their host" to Rotate (locked #23).
- For Mixed-with-1-rotating, the entire Advanced routing rules expander disappears.

### Meeting location — full restructure
Two iterations:
1. First added a "Booker location options" card with two toggles (Multiple Locations, Ask the Booker) alongside the existing per-host inline dropdowns. Swadha called this out as broken IA — two parallel ways to set locations.
2. Restructured into a single **Meeting Location** card with one mode picker (per_host / single / multiple / ask_booker). Per-host inline dropdowns removed from team-member rows; per-host editor lives inside the new card under the per_host mode. (Locked #24, #25, #26.)

### Files touched in this session
- `prototype/src/data/mockCalendars.ts` — added `locationMode` field, defaults to `per_host`
- `prototype/src/composables/useCalendarState.ts` — `tabCompleteness`, `canSave`, sidebar subtitles, no-tile-name leak
- `prototype/src/pages/CalendarWizardPage.vue` — sidebar completion signals, Save button gating
- `prototype/src/layouts/AppShell.vue` — removed "+ New Appointment"
- `prototype/src/components/prototype/WidgetAppearance.vue` — full rebuild
- `prototype/src/components/prototype/StaffAssignment.vue` — strategy card cleanup, Meeting Location card, removed per-host inline locations, distribution algorithm rename + visibility, host priority + booker-staff-selection rules
- `prototype/src/components/prototype/BookingRulesUnified.vue` — capacity behaviour radio moved above number, label morphs, amber nudge
- `prototype/src/components/prototype/AvailabilityUnified.vue` — recurring disabled state + helper, sharpened subtitle
- `prototype/src/components/prototype/BasicDetailsUnified.vue` — Booking URL surfaced as primary, sharpened subtitle
- `prototype/src/components/prototype/LocationPicker.vue` — added Multi-location + Ask Booker for Event mode; switched to use `locationMode`
- `prototype/src/components/prototype/BookerWidgetPreview.vue` — removed the duplicated derived-label chip
- `prototype/src/components/setup/MeetingsVertical.vue` — custom tooltips on action icons
- `prototype/src/components/prototype/FormConfirmation.vue`, `PaymentsSettings.vue`, `NotificationsPolicies.vue`, `BookingChannels.vue` — sharpened tab subtitles

## Session 3 — Capacity & Location overhaul (2026-04-26)

A long working session that overhauled both the Meeting Location IA and the Capacity per slot card, plus tightened many adjacent settings. Highlights below; full per-decision rationale lives in locked decisions #31–54.

### Settings matrix audit (resolved upfront)
Audited the full settings matrix vs. the prototype. Verified Section B legacy gaps were lifted (Phone/Address/Zoom for Class, Payments per guest, Classic widget for Class, External Sync for all, etc.). Found two real gaps:
1. `LocationPicker.vue` was offering "Ask the Booker" for Collective (matrix said ❌). **Resolved by lifting** — Collective shares one location anyway, so asking the booker to pick the venue is meaningful. Matrix updated; Section B annotated.
2. Assign-contacts toggle had no visibility gate for 0-host (Event) calendars. **Fixed** — gated the entire "Additional settings" card on `teamMembers.length > 0`. (Edge case #32, locked decision via locked-decision-doc revision.)

### Tile names — clarification
TemplatePicker tiles ("1:1 Meeting / Group Session / Team Rotation / Panel / Committee / Event") were flagged as inconsistent with locked decision #5 (legacy names). **Resolved by amending #5** — tiles are intent-based starters; legacy names only apply to derived labels post-creation.

### Meeting Location — full redesign (replaces Session 2 design)
The Session 2 4-mode picker (`per_host / single / multiple / ask_booker`) was replaced with a single shape-aware Meeting Location card (decision #31). Major shifts:
- Multi-host RR/Class: per-host inline dropdowns sit IN the team-member rows (reverses Session 2 #25). Each dropdown shows the full 7-option menu with disabled states for unconnected tools and for "Ask the booker" (decision #34).
- 0/1 host: single dropdown with the full 7-option menu, "+ Add another option" available (decisions #31, #33).
- Collective/Mixed: shared dropdown with tool *categories* (not member×tool flat) + "Hosted by" sub-picker only when 2+ eligible members. Multi-location enabled. Sub-picker filters to required attendees for Mixed (decisions #33, #40).
- General principle (#36): show all 7 options always, disabled with explanatory tooltips for unsupported. Never silently omit. Inline hint at the bottom of the card points users to the gating change that would unlock disabled features.
- Save was originally hard-gated on Location, then softened to recommended-only (#37 revised) — bookers technically can book without a venue.
- Live preview chip + auto-fill on first host add (decisions #38, #39) eliminate the #1 support-ticket source.

### Owner picker — consolidated into role rows
Standalone "Primary owner" card removed. Owner star sits inline on team-member rows (Collective) or required-member rows in `MemberRoleAssigner` (Mixed). Auto-promotion still applies on host removal / strategy change (#41).

### Routing rules — tightened
- Contact-routing settings split into clear sub-sections with explicit per-action headers: "WHEN THEY RESCHEDULE AN EXISTING BOOKING" vs "WHEN THEY BOOK A NEW APPOINTMENT" (#43).

### Mixed strategy guards
- Last required member can't be marked Rotating (#42).
- All-required Mixed → on save, persists as Collective + clears `requiredAttendeeIds` (#47). Inline notice in `MemberRoleAssigner` warns the user.
- Strategy resets to `null` when host count drops below 2 (#45).

### Recurring + multi-host — confirm before disabling
Replaces the Session 2 silent-toast-after pattern with a confirm modal *before* the host gets added (#46). User can Cancel; only on Continue is the host added and recurring auto-disabled.

### Derived label rule reorder
`staffCount === 0 → Event Calendar` moved to first slot (#44). Eliminates the "host-less Class Booking" weird state where the Event template (`seats=50, behavior=shared`) was deriving as Class Booking.

### Capacity per slot — full redesign
Replaces the behavior radio + capacity number + auto-bump pattern with **3 outcome cards** in order Single booking → Parallel bookings → Group session (#52). Number lives inside the chosen card. Parallel disabled for Collective/Mixed with tooltip + inline helper. Show-seats-remaining checkbox lives inside the Group card. Locked decision #48 (auto-bump on Group radio) is superseded by #52.

Card descriptions are shape-aware and morph for single host / multi-host rotate / Collective/Mixed (#52). "Solo" was renamed to "Single booking" (#54) because with multi-host rotate the slot can fill multiple times — calling it "solo" misled.

### Guests — promoted to its own card
Removed from inside the Capacity card. Now a sibling card titled "Guests" with shape-aware explanation block + booker preview (#51, #53). Math example in the Group case scales to capacity to avoid nonsense at small caps ("A booker bringing 1 guest fills 2 of those seats — filling the group."). 

### Vue side-fix
Removed the outer `<transition>` wrapper on the strategy block in `StaffAssignment.vue` — nested transitions deadlocked when host count dropped, leaving the strategy section stuck in `leave-active` state.

### Width fix
Removed `max-w-[1200px] mx-auto` from `CalendarWizardPage.vue` content container — wizard now fills the viewport like the header.

### Files touched in Session 3
- `prototype/src/components/prototype/StaffAssignment.vue` — inline per-host location dropdown in team-member rows; owner star inline; `pendingHostAdd` ref + recurring confirm modal; strategy reset on host drop; auto-promote owner on strategy change; clearer per-action contact-routing headers; outer strategy `<transition>` removed
- `prototype/src/components/prototype/LocationPicker.vue` — full rewrite as shape-aware unified card; `dropdownOptions` always-show-all-7 with disabled states; sub-picker for "Hosted by" (always when video tool selected on shared shape); preview chip; auto-correct watcher
- `prototype/src/components/prototype/MemberRoleAssigner.vue` — accepts `currentOwnerId` + emits `setOwner`; inline owner star on required rows; blocks demoting last required
- `prototype/src/components/prototype/BookingRulesUnified.vue` — 3 outcome cards for capacity (Single → Parallel → Group); guests pulled into separate card; shape-aware copy + booker preview; gray notice splits at seats=1 vs >1; selection-derivation logic
- `prototype/src/components/prototype/NotificationsPolicies.vue` — assign-contacts card gated on `teamMembers.length > 0`
- `prototype/src/composables/useCalendarState.ts` — `derivedType` rule reorder (staff=0 first); `saveCalendar` with Mixed→Collective collapse; `isStaffLocationConfigured` for sidebar dot; canSave gated on name only
- `prototype/src/pages/CalendarWizardPage.vue` — Save button wired to `saveCalendar`; `max-w-[1200px]` removed for full-width content

## Open issues — TODO for next session

- ~~**Tile names still mismatch locked decision #5.**~~ **Resolved 2026-04-26.**
- ~~**LocationPicker still offers "Ask the Booker" for Collective.**~~ **Resolved 2026-04-26.**
- **Sidebar active-state lag bug.** When clicking through the More-settings sub-list, the highlight stays one item behind. Vue ref/binding issue in `CalendarWizardPage.vue:144-167`. Engineering, not product.
- **Copy consistency** (scoped). Don't sweep everywhere — only fix where the term in use actively misleads (e.g. legacy *"Parallel slots"* references on surfaces other than the capacity card). Most of the surface area was settled in Session 3.
- ~~**Service Booking row on calendar list looks first-class.**~~ **Resolved 2026-04-26 by locked decision #60:** existing service calendars move to a separate tab post-launch (same pattern as Services v1 → v2). New "+ New calendar" never creates service calendars.
- ~~**Booker widget preview** is stale.~~ **Resolved 2026-04-26:** rebuilt as a 2-page widget matching production layout (Page 1: Date + Slot; Page 2: Form + Guest + Payment). `BookerPreviewPage.vue` adds a scenario picker for one-click validation.
- **Class booker UX parking lot** — mostly resolved by the simplification (decision #58); only help-doc edge cases remain.
- **AI setup assistant** — flow drafted in locked decision #61. Engineering needs to refresh the prompt + tool-use schema to map intent dimensions → unified-calendar config (no legacy-type intermediate).
- ~~**Migration view (`MigrationDemo.vue`)**~~ **Resolved 2026-04-26:** no migration view needed (locked decision #11 stands — existing calendars stay where they are).
- **Backend mapping table** — engineering will need a `_oldType` → `(strategy, seatsPerSlot, bookingBehavior, locationMode)` mapping for migration. Not in scope for product but worth flagging.
- **Mixed all-rotating edge case** — already covered by amended decision #47. SmartTip notice + save-time collapse to Round Robin.

## Cowork session id (for context)

`local_c48ac6dd-5f2b-4b70-b9bf-e1784c6b4bb3` (created 2026-04-25, continued same day with UI implementation pass)
