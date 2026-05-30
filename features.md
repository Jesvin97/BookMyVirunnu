# BookMyVirunnu - Premium Wedding Hospitality Portal

BookMyVirunnu is a host-led wedding hospitality portal designed specifically for newlywed couples in Kerala to coordinate, schedule, and manage traditional post-wedding home-feast invitations (*Virunnu*) from family and friends without turning hospitality into a generic SaaS workflow.

This document details all the key features, design elements, and interactive flows implemented in the application.

---

## 1. 3-Line Core Context

1. **What the project is**: A premium, host-led wedding hospitality portal for newlyweds in Kerala to coordinate home-feast invitations (*Virunnu*) from family and friends.
2. **What problem it solves**: It prevents the overwhelming social exhaustion of coordinating back-to-back home visits by replacing chaotic manual chats with a quiet, structured RSVP calendar where couples can block off rest days.
3. **Who is going to use it**: The newlyweds share a passwordless link, and hosting relatives (who are "calling" the couple over for a feast) use it to reserve a single Lunch/Dinner slot and share their home location using GPS geocoding.

---

## 2. Key Application Features

### A. Newlywed Setup Wizard (Interactive & Gamified)
Instead of a boring Google Form, couples create their feast calendar via a beautiful, step-by-step interactive wizard card:
- **Step 1: Newlywed Identity 💖**:
  - Prompt: *"Who are the happy newlyweds?"*
  - Collects: *Husband's Name* & *Wife's Name*.
  - **Animations**: Hitting Enter or clicking Continue plays a **romantic heart/sparkle celebratory particle splash** across the screen and slides the card smoothly to the next step.
  - **Zero-Bother Generation**: We completely removed the "Calendar Title" and "Description" input fields. These are automatically generated behind the scenes (e.g. `Joyal & Anjali's Feast Schedule 🍛`) with warm Kerala hospitality invitation text.
- **Step 2: Availability & Rest Date Blocker 📅**:
  - Prompt: *"When are you available for feasts & when do you need rest?"*
  - Collects: *Start Date* & *End Date*.
  - **Quick Rest Blocker**: Newlyweds can tap on specific dates they want to block out immediately for privacy/rest (e.g. Honey-moon days). Blocker dates highlight in soft crimson red with a wiggling scale transition (`scale(1.05) -> scale(1)`).
- **Step 3: Meal Selections, Dietary Restrictions & Contact 🍛**:
  - Prompt: *"Select your available meals, dietary preferences & contact 📞"*
  - Collects:
    - **Lunch (Sadhya)** & **Dinner (Virunnu)** toggle selection cards.
    - **Dietary Restrictions Grid**: Interactive grid of multi-select badges: `Vegetarian 🥬`, `Halal 🥩`, `No Beef 🚫🥩`, `Eggless 🥚`, `Nut Allergy 🥜`, `No Restrictions ✨` (scales up 3% and glows in emerald green when selected).
    - *Phone Number* for contact.
- **Instant Passwordless Authentication**: Upon wizard completion, the couple is instantly logged in on their current browser and redirected to their dashboard.
- **Bookmark Dashboard Link**: The success screen generates both their relative booking link and a private management dashboard link (`/couple?id=EVENT_ID`) with an explicit alert prompting them to bookmark it, as no email or password is required.

### B. Newlywed Dashboard (`/couple`)
- **Passwordless ID Login**: Couples can access their dashboard from any browser/device by entering their 24-character Feast ID on `/login`, or by opening their bookmarked link (`/couple?id=EVENT_ID`) which automatically signs them in and cleanses the address bar.
- **Feast Schedule**: Shows a clean schedule of home-hosted invitations with hosting family details, meal type, contact numbers, and home addresses.
- **📍 Get Directions**: One-click Google Maps directions button for easy navigation to host homes.
- **Address Concealment Security**: Relatives' home addresses remain safely masked as `Masked (Revealed 24h prior) 🔒` until 24 hours before the feast to protect privacy.
- **Slot Blocking Manager**: Couples can click on any open slot on their calendar to manually block it (e.g., if they get tired or make private plans), or unblock it instantly.

### C. Relative RSVP Booking Wizard (`/book/[eventId]`)
When relatives open the couple's booking link, they are taken directly to the entrance page of a beautiful booking wizard:
- **Dietary Preferences Alert 🥗**: At the very top, a prominent notice card declares the couple's dietary restrictions (e.g., *Vegetarian 🥬, No Beef 🚫🥩*) so the hosting relative knows their preferences before making any cooking plans.
- **Step 1: Choose a Slot 🍛**:
  - Displays the calendar grid of available Lunch and Dinner slots.
  - Pre-blocked rest dates or booked slots are completely greyed out and locked (`🔒`).
  - **Animation**: Selecting a slot scale-bounces it and slides automatically to Step 2.
- **Step 2: Host Identity & Contact ✉️**:
  - Collects: *Family Name* (e.g., `Jesvin & Family`), *Phone Number*, and *Email Address*.
  - Hitting Continue transitions smoothly to Step 3.
- **Step 3: Venue GPS Locator 📍**:
  - Prompt: *"Where is the feast being hosted?"*
  - **No Redundancies**: The culinary request textarea has been completely removed to keep the booking fast and tidy.
  - **📍 Locate Me GPS button**: Uses browser geolocation and OpenStreetMap's free **Nominatim API** to reverse-geocode coordinates into a human-readable street address.
  - **Animations**: Clicking GPS morphs the button into a spinning circle loader (`⏳ Pinpointing...`) and pulses the address box in an emerald green glowing outline. Once resolved, the address is smoothly auto-typed.
  - **Shower of Sparkles**: Submitting the RSVP triggers a shower of golden celebratory sparkles and directs them to a successful booking screen.

---

## 3. Visual & Aesthetic Architecture

### A. Kerala Sadhya Color Palette
- **Primary Background**: Sleek dark space cadet (`#040906`, `#03200d`) with a subtle glowing radial background blur.
- **Accents**: Neon Mint Green (`#34d399`) and Emerald (`#059669`) to reflect fresh banana leaves and organic warmth.
- **Rest Blocks**: Elegant crimson soft red (`#f87171`) to mark rest days and blackouts.

### B. High-End Micro-Animations
- **Page Slides**: Step transitions utilize CSS `@keyframes` transitions (`fadeInRight` and `fadeOutLeft`) for a smooth carousel deck feeling.
- **Celebration Particle Sprinkles**: Floating hearts/sparkle particle effects triggered on successful newlywed setup and relative RSVP submission.
- **Pulsing Lights**: Active buttons and geolocators use `@keyframes pulseGlow` neon outlines.
