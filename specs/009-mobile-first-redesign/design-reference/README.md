# Spec 009 — Mobile-first redesign: design reference

Input for spec 009 in `angular-frontend-toolbox`. Drawn on 2026-11-25 in the claude.ai Design canvas « Dépenses — mobile first (révision) » (https://claude.ai/artifact/EKWp9HDMKDxYurn9Nrtj7T, owner only). This folder holds a copy of every screen so the spec can be written without access to the canvas.

**Why:** the app is mostly used on phones (owner, 2026-11-25), and the budget and recurring operations were hard to find. This redesign keeps every feature of specs 005–008 and the same backend contracts. It changes layout, navigation and a few interactions.

## How to read `screens/`

- Each `*.dc.html` is one phone screen, 390 px wide, from the Design canvas. It is **reference markup, not code to copy**: inline styles, hex colours and `{{holes}}` / `<sc-for>` / `<sc-if>` / `<dc-import>` belong to the canvas format. It does not render outside the canvas (it needs the canvas runtime `support.js` and an uploaded stylesheet).
- Colours, fonts and radii come from the Olivier theme. In the app they map to `--ui-*` tokens (Stylelint forbids raw values). Example figures (657 DT, Sofiane, Amira) are sample data.
- `TopBar.dc.html` and `TabBar.dc.html` are shared components imported by the other screens.
- Each screen ends with a `<script>` whose `renderVals()` holds the sample data for lists.

## Navigation (applies to every signed-in screen)

| Element | Content | Screen file |
|---|---|---|
| Top bar | ☰ menu (opens the drawer) · centre: book name with ▾ (opens the drawer on the books section) or the page title · avatar (→ Compte) | `TopBar.dc.html` |
| Drawer (side sheet) | Account header · **Carnets**: household book, personal books, « Nouveau carnet » · **Accueil**, **Opérations** · **Prévoir**: Budgets (hint « nov. · 657 DT restants »), Récurrentes (hint « 5 règles »), Analyse du mois · **Foyer et compte**: Foyer (hint « 2 membres »), Compte · **Apparence**: Clair / Sombre / Système · **Langue**: Français / English / العربية · Se déconnecter | `Drawer.dc.html` |
| Bottom tabs | Accueil · Opérations · **+** (raised, opens the add sheet) · Budget · Récurrentes. Foyer and Compte leave the tabs and move to the drawer. Screens reached only from the drawer show no active tab. | `TabBar.dc.html` |

The desktop layout (side rail) is out of scope for the screens but must keep working; the rail should list the same destinations as the drawer.

## Screens

| # | Screen | File | What changes from spec 005–008 | API (unchanged unless stated) |
|---|---|---|---|---|
| 1 | Accueil | `Main.dc.html` | Order: month switcher → hero « Reste à dépenser » → **« Aujourd'hui »** (today's entries with author) → « À surveiller » → « À venir » → link card « Analyse du mois ». Pace chart, categories, 6-month trend and members move to screen 5. | summary, budget, transactions |
| 2 | Ajouter (one-off) | `MobAdd.dc.html` (interactive) | Opens on the **amount with an on-screen keypad** (1–9, « , », 0, ⌫; 3 decimals for TND; live formatting). **Switch « Une seule fois \| Récurrente »** at the top. Category: the most likely one is pre-selected and marked « suggérée » (local prediction: frequency × time of day, per account and book), then other recent categories, then « Autre catégorie… » (picker). Three recent entries as one-tap templates (amount + category). Date chips Aujourd'hui / Hier, « Note » chip; the date picker and comment are collapsed. Save button shows the amount. | `POST transactions` |
| 3 | Ajouter (recurring pre-selected) | `MobAddRecurring.dc.html` → imports `MobAdd` with `mode="recurring"` | Same sheet opened from « Nouvelle opération récurrente ». In recurring mode the title becomes « Nouvelle opération récurrente », the date row becomes frequency (« Chaque mois ▾ »: every N weeks / months / years) and start / end (« Dès aujourd'hui · sans fin »), the save label says « chaque mois ». **Default mode depends on where the sheet was opened.** | `POST recurring-rules` |
| 4 | Modifier une opération | `EditEntry.dc.html` | Form sheet with filled fields, « Ajoutée par … · modifiée par … », « Supprimer l'opération… » placed in the body (away from Enregistrer), with confirmation. | `PATCH` / `DELETE transactions/{id}` |
| 5 | Analyse du mois | `Analysis.dc.html` | New page: month switcher, pace chart (fixed bills excluded), categories as sorted bars (tap → operations filtered), 6-month trend, « Qui a ajouté quoi » per member. Reuses the spec 008 chart components. | summary |
| 6 | Opérations | `OpsList.dc.html` | Month switcher with month totals, search field, filter **chips** (Tout, Dépenses, Revenus, Catégorie ▾, Membre ▾), day groups with day total, rows show category · author, tap → screen 4. | transactions (cursor) |
| 7 | Choisir une catégorie | `CategoryPicker.dc.html` | Sheet: search, recent chips, single-open accordion top → group → leaf (as fix 007). | categories |
| 8 | Budget (current month) | `MobBudget.dc.html` | **Month strip** replaces the arrows: past months « Clos », current « En cours », planned « Prévu », empty future months « À faire » (dashed). Overview (Prévu / Dépensé / Reste + meter + « Copier le budget d'octobre »), Revenus attendus, lines « dépensé / prévu » with meter, tap a line to edit its amount, « Hors budget » with « Ajouter ». A dark **save bar** (« 1 modification · … » Annuler / Enregistrer) appears only when there are unsaved changes. | `GET/PUT budgets/{YYYY-MM}`, `POST …/copy` |
| 9 | Budget (future month) | `MobBudgetFuture.dc.html` | Empty state for a month without a plan: « Copier décembre 2026 » / « Partir de zéro ». Card « Déjà connu pour janvier »: recurring rules due that month and the total of fixed expenses already committed, computed in the app from the rules. Up to current month + 12 (backend limit). | budgets, recurring-rules |
| 10 | Récurrentes | `Recurring.dc.html` | Own tab. Card « En moyenne chaque mois, déjà prévu » (fixed expenses, income) + « Nouvelle opération récurrente » (→ screen 3). Lists Dépenses / Revenus: name, « Tous les 2 mois · prochaine le … », amount. « Terminées (n) » collapsed. Tap → screen 11. | recurring-rules |
| 11 | Modifier une règle | `RuleSheet.dc.html` | Edit only (creation moved to screen 3): amount, category, every N × semaine / mois / an (segmented), start, optional end, info « Prochaine : … », « Arrêter cette récurrence… ». | `PATCH recurring-rules/{id}` |
| 12 | Foyer | `Household.dc.html` | From the drawer. Household card (rename for owner), members with options menu, « Inviter quelqu'un », pending invitations (Annuler), sensitive actions at the bottom (Supprimer le foyer / Quitter le foyer). | households, members, invitations |
| 13 | Inviter | `Invite.dc.html` | Sheet with tabs « Par e-mail » / « QR code, sur place »; QR with countdown (10 min) and « Nouveau code ». | invitations, qr-invitations |
| 14 | Compte | `Account.dc.html` | From the avatar or drawer. Read-only profile rows for now, Langue, Thème, two-step switch, Google, Se déconnecter. | identity |
| 15–18 | Connexion, Inscription, Code, Mot de passe oublié | `SignIn`, `SignUp`, `Code`, `Forgot` | Phone layouts of the spec 005 pages; FR / EN / ع switch on sign-in; sign-up takes the account locale from the chosen UI language; one code screen for e-mail confirmation and two-step; forgot password in 2 steps on one page with a neutral message. | identity |
| 19–21 | Premier pas, Créer le foyer, Créer le carnet | `Welcome`, `NewHousehold`, `NewBook` | Phone layouts of spec 006; step indicator 1/2, 2/2; the last step ends on « Créer et noter une première dépense » (opens screen 2). | households, books, invitations |

## Toolbox impact (to confirm in the design phase)

Likely reused: top bar, bottom tabs, dialog/sheet, month switcher, segmented control, chip group, list item, empty state, code input, meter, bar list, pace chart, trend bars.

Likely new (toolbox, presentational): **drawer / side sheet** (CDK dialog, start edge, RTL-aware), **amount keypad** (deferred since spec 004), **month strip** (or a chip-group variant), **save bar** (sticky action bar), possibly a **raised tab action**.

## Out of scope

- Editing the profile and the password while signed in, and the `ar` account locale: backend gaps, later (owner, 2026-11-25). Compte shows these rows read-only.
- The « Historique » block of the Foyer screen: no backend endpoint; leave it out.
- Desktop redesign beyond keeping the rail in line with the drawer.
- Capacitor, widgets, haptics (spec 011).

## Open questions (ask the owner in one batch)

1. Routes: new pages `/analyse` and the recurring tab — keep `/operations/recurrentes` or move to `/recurrentes`?
2. Category suggestion: rule for the pre-selected category (most frequent at this hour over the last N entries?) and what to show with no history.
3. Recurring from the add sheet reverses the spec 008 recommendation « rules created only from their screen »: confirm.
4. « Déjà connu pour … » on future budgets: only show it, or also pre-fill plan lines from recurring rules?
5. Templates: the 3 most recent distinct entries, or the 3 most frequent?
6. Keypad on desktop: keep the keypad or use the normal amount field?
