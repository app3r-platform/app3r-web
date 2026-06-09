# Wave0 Deliverable #4 — State Machine Map

> **Status:** DRAFT — quality gate required before implementation  
> **Sources:** listing-meta.ts (LISTING_STATES), repair-workflow.ts (job states), D59/D83 rulings  
> **Modules:** repair / maintain / resell / scrap / parts  
> **Actors:** WeeeU (customer) / WeeeR (repair shop) / WeeeT (technician) / Admin

---

## 1. Listing State Machine (Universal — all modules)

Defined in: `listing_meta.state` (D83 canonical)

```
                    ┌─────────────────────────────────────────────────────┐
                    │                  LISTING STATES                      │
                    └─────────────────────────────────────────────────────┘

[draft] ──publish──→ [announced] ──has_offer──→ [receiving_offers]
                          │                              │
                          │ cancel                       │ select_offer
                          ↓                              ↓
                     [cancelled]               [offer_selected]
                          ↑                              │
                          │ cancel                       │ buyer_confirm
                          │ (bad_record)                 ↓
                          │                    [buyer_confirmed]
                          │                              │
                          │                              │ start_work
                          │                              ↓
                          │                        [in_progress]
                          │                              │
                          │ dispute                      │ mark_delivered
                          │                              ↓
                          │                        [delivered]
                          │                              │
                          │                              │ approve / timeout
                          │                              ↓
                          │                    [inspection_period]
                          │                              │
                          │                              │ pass_inspection
                          │                              ↓
                          │                        [completed]
                          │
                          └──────────── any state → [disputed] → Admin resolves
```

### Transition Rules by Actor

| From State | Action | Actor(s) | Result |
|-----------|--------|----------|--------|
| draft | publish | Owner (any) | announced |
| draft | delete | Owner (any) | (hard delete) |
| announced | cancel | Owner, Admin | cancelled |
| announced | has_offer | System (on offer create) | receiving_offers |
| receiving_offers | cancel | Owner, Admin | cancelled (bad_record if ≥1 offer) |
| receiving_offers | select_offer | Owner | offer_selected |
| offer_selected | buyer_confirm | Buyer (WeeeU) | buyer_confirmed |
| offer_selected | withdraw | Buyer (WeeeU) | receiving_offers |
| buyer_confirmed | start_work | WeeeR/WeeeT | in_progress |
| in_progress | mark_delivered | WeeeR/WeeeT | delivered |
| in_progress | dispute | WeeeU, WeeeR, WeeeT | disputed |
| delivered | approve_inspection | WeeeU | inspection_period |
| delivered | dispute | WeeeU | disputed |
| inspection_period | pass_inspection | WeeeU, System (timeout 72h) | completed |
| inspection_period | dispute | WeeeU | disputed |
| completed | (terminal) | — | — |
| cancelled | (terminal) | — | — |
| disputed | resolve_complete | Admin | completed |
| disputed | resolve_cancel | Admin | cancelled |
| disputed | reopen | Admin | (previous state) |

### D83 Overlay Rules (edit/cancel guards)

| State | Edit Allowed | Cancel Allowed | Escrow |
|-------|-------------|---------------|--------|
| draft | ✅ Free | ✅ Free (hard delete) | None |
| announced | ✅ Free | ✅ Free | None |
| receiving_offers | ❌ Locked | ✅ With bad_record flag | None |
| offer_selected | ❌ Locked | ❌ Blocked | Escrow held |
| buyer_confirmed | ❌ Locked | ❌ Blocked | Escrow held |
| in_progress | ❌ Locked | ❌ Blocked | Escrow held |
| delivered | ❌ Locked | ❌ Blocked | Escrow held |
| inspection_period | ❌ Locked | ❌ Blocked | Escrow held (pending) |
| completed | ❌ Terminal | ❌ Terminal | Escrow released |
| cancelled | ❌ Terminal | ❌ Terminal | Escrow returned |
| disputed | ❌ Locked | ❌ Admin only | Frozen |

---

## 2. Module-Specific Job States

### 2a. Repair Module (WeeeR + WeeeT)

Source: `services.status` + `repair_job_state_transitions`

```
[draft]
  │ WeeeU submits repair request
  ↓
[published]
  │ WeeeR/WeeeT accepts job
  ↓
[in_progress]
  │ WeeeT fills B3 checklist
  ↓
[checklist_submitted]
  │ WeeeR reviews
  ├─ Normal → [parts_picker_submitted]? → [packages_offered]
  └─ Declined → [scrap_offered]
                   │
                   ├─ WeeeU accepts → [scrap_accepted] → completed
                   └─ WeeeU rejects → [scrap_rejected] → cancelled

[packages_offered]
  │ WeeeU accepts package
  ↓
[awaiting_parts] (if NEED_ORDER)
  │ parts arrive
  ↓
[in_progress] (repair ongoing)
  │ WeeeT completes repair
  ↓
[completed]
```

**Repair States:**
| State | Who Sets | Description |
|-------|---------|-------------|
| `draft` | WeeeU | Created, not submitted |
| `published` | WeeeU | Submitted, seeking WeeeR |
| `in_progress` | WeeeR | Job accepted, work started |
| `checklist_submitted` | WeeeT | B3 checklist complete |
| `parts_picker_submitted` | WeeeT | B3.5 parts list submitted |
| `packages_offered` | WeeeR | B2.5 offer packages sent |
| `awaiting_parts` | WeeeR | Parts ordered, not arrived |
| `scrap_offered` | WeeeR | Scrap acquisition offered |
| `scrap_accepted` | WeeeU | Scrap deal accepted |
| `scrap_rejected` | WeeeU | Scrap rejected, item returned |
| `completed` | System | Payment settled |
| `cancelled` | Any | Job cancelled |

**Repair Actor Matrix:**

| State | WeeeU can | WeeeR can | WeeeT can | Admin can |
|-------|-----------|-----------|-----------|-----------|
| draft | submit, delete | — | — | delete |
| published | cancel | accept | — | cancel |
| in_progress | view | assign-tech, cancel (Admin approval) | fill B3 | override |
| checklist_submitted | view | review B3 | resubmit | override |
| parts_picker_submitted | view | review B3.5 | resubmit | override |
| packages_offered | accept/reject | modify | view | override |
| awaiting_parts | view | update ETA | receive parts | override |
| scrap_offered | accept/reject | modify offer | view | override |
| completed | rate | — | — | dispute |
| cancelled | — | — | — | investigate |

---

### 2b. Maintain Module (WeeeT)

Simpler flow — no B3/B3.5/B2.5 complexity:

```
[draft] → [announced] → [receiving_offers] → [offer_selected]
         → [buyer_confirmed] → [in_progress] → [completed]
```

**Maintain States:**
| State | Who Sets | Description |
|-------|---------|-------------|
| `draft` | WeeeU | Service request created |
| `announced` | WeeeU | Public, seeking WeeeT |
| `receiving_offers` | System | At least one quote received |
| `offer_selected` | WeeeU | Quote chosen, escrow held |
| `buyer_confirmed` | WeeeU | Confirmed appointment |
| `in_progress` | WeeeT | On-site work started |
| `delivered` | WeeeT | Work complete, WeeeU to inspect |
| `completed` | WeeeU/System | Inspection passed, payment settled |
| `cancelled` | Any | Cancelled |
| `disputed` | Any | Admin intervention |

**Maintain Actor Matrix:**

| State | WeeeU can | WeeeT can | Admin can |
|-------|-----------|-----------|-----------|
| draft | submit, delete | — | delete |
| announced | cancel | quote | cancel |
| receiving_offers | select offer, cancel | modify quote, withdraw | cancel |
| offer_selected | confirm, withdraw | view | cancel |
| buyer_confirmed | — | start work | override |
| in_progress | dispute | mark delivered | override |
| delivered | approve, dispute | — | override |
| completed | rate | rate | — |
| disputed | — | — | resolve |

---

### 2c. Resell Module (WeeeU + WeeeR as sellers)

```
[draft] → [announced] → [receiving_offers] → [offer_selected]
         → [buyer_confirmed] → [in_progress] → [delivered]
         → [inspection_period] → [completed]
```

**Resell States** (same as universal listing states, see §1):

**Resell Actor Matrix:**

| State | WeeeU (buyer) | WeeeU (seller) | WeeeR (seller) | Admin |
|-------|--------------|---------------|----------------|-------|
| draft | — | edit, publish, delete | edit, publish, delete | delete |
| announced | view, offer | edit, cancel | edit, cancel | cancel |
| receiving_offers | offer, withdraw | select offer, cancel* | select offer, cancel* | cancel |
| offer_selected | confirm, withdraw | — | — | cancel |
| buyer_confirmed | — | prepare item | prepare item | override |
| in_progress | — | ship/hand-off | ship/hand-off | override |
| delivered | approve, dispute | — | — | override |
| inspection_period | pass, dispute | — | — | override |
| completed | rate | rate | rate | — |
| disputed | — | — | — | resolve |

*cancel after offers = bad_record policy applies

---

### 2d. Scrap Module (WeeeU + WeeeR)

```
[draft] → [announced] → [receiving_offers] → [offer_selected]
         → [buyer_confirmed] → [in_progress] → [completed]
```

**Scrap Actor Matrix:**

| State | WeeeU (owner) | WeeeR (buyer) | Admin |
|-------|--------------|---------------|-------|
| draft | edit, publish, delete | — | delete |
| announced | cancel | place bid | cancel |
| receiving_offers | select bid, cancel* | modify bid, withdraw | cancel |
| offer_selected | confirm | — | cancel |
| buyer_confirmed | — | collect | override |
| in_progress | dispute | mark collected | override |
| completed | rate | rate | — |
| disputed | — | — | resolve |

---

### 2e. Parts Module (B2B — WeeeR supplier + WeeeT buyer)

```
[draft] → [published] → [active]

Order Flow:
[cart] → [checkout] → [pending_payment] → [paid] → [processing]
       → [shipped] → [delivered] → [completed]
       → [cancelled] / [return_requested] → [returned]
```

**Parts Listing States:**
| State | Who Sets | Description |
|-------|---------|-------------|
| `draft` | WeeeR | Not yet listed |
| `published` | WeeeR | Listed, available |
| `inactive` | WeeeR/Admin | Hidden |
| `out_of_stock` | System | Stock = 0 |
| `discontinued` | WeeeR | Permanently retired |

**Parts Order States:**
| State | Who Sets | Description |
|-------|---------|-------------|
| `pending_payment` | System | Order placed, awaiting payment |
| `paid` | System | Payment confirmed |
| `processing` | WeeeR | Preparing for shipment |
| `shipped` | WeeeR | Tracking number issued |
| `delivered` | System/WeeeT | Delivery confirmed |
| `completed` | WeeeT/System | Inspection passed |
| `cancelled` | WeeeT/WeeeR/Admin | Cancelled |
| `return_requested` | WeeeT | Return filed |
| `returned` | WeeeR | Return accepted |
| `disputed` | WeeeT/WeeeR | Admin intervention |

---

## 3. Complete Actor Permission Summary

| Operation | WeeeU | WeeeR | WeeeT | Admin |
|-----------|-------|-------|-------|-------|
| Create service/listing | ✅ (all types) | ✅ (repair shop-side) | ✅ (maintain) | ✅ |
| Publish listing | ✅ | ✅ | ✅ | ✅ |
| Submit offer/bid | ✅ (buyer) | ✅ (parts) | ✅ (maintain quote) | — |
| Accept offer | ✅ (owner) | ✅ (owner) | ✅ (owner) | ✅ |
| Fill B3 checklist | — | — | ✅ | — |
| Fill B3.5 parts picker | — | — | ✅ | — |
| Propose B2.5 packages | — | ✅ | — | — |
| Release escrow | — | ✅ (on complete) | ✅ (on complete) | ✅ |
| Topup Gold | ✅ | ✅ | ✅ | ✅ |
| Withdraw Gold | ✅ | ✅ | ✅ | ✅ |
| Approve transfer | — | — | — | ✅ |
| Resolve dispute | — | — | — | ✅ |
| Access admin config | — | — | — | ✅ |
| Access moderation | — | — | — | ✅ |

---

## 4. Event → Notification Mapping

| Event | Recipient | Notification Type |
|-------|-----------|-----------------|
| New offer received | Owner | `offer_arrived` |
| Offer accepted | Buyer | `status_update` |
| Job state changed | Both parties | `status_update` |
| Payment completed | Both parties | `payment_confirm` |
| Parts shipped | Buyer (WeeeT) | `status_update` |
| OTP requested | User | (email, not in-app) |
| Chat message | Recipient | `chat_message` |
| Technician ETA update | WeeeU | `eta_update` |
| Dispute raised | Admin + both parties | `status_update` |

---

## 5. Open Questions for Advisor

1. **Maintain "in_progress" entry point** — can WeeeT mark in_progress before WeeeU confirms (buyer_confirmed)? Or is WeeeU confirmation mandatory? Current assumption: mandatory.
2. **Scrap "offer_selected" → "completed"** — is there an inspection period for scrap, or is it direct completed after collection? Recommendation: direct (no inspection needed for scrap).
3. **Parts return flow** — should returned → refund trigger `refundGold` automatically, or require Admin approval first? Recommendation: Admin approval for partial returns; automatic for full returns.
4. **Parts B2B payment** — Gold or external payment (2C2P/bank transfer)? Current schema supports both. Needs Advisor ruling for Wave1.
