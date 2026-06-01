## Core Page Architecture

To deliver this experience seamlessly, the application only needs **three primary page layouts**. This keeps the prototype lightweight while maintaining clear separation of concerns.

### Auth & Onboarding Entry

* **Purpose:** Secure the user session and capture their personalized learning identity.
* **Layout:** A minimalist, focused screen that transitions from credentials straight into a step-by-step onboarding flow if just created an account.

### Diagnostic Gateway

* **Purpose:** Establish the baseline mathematical proficiency of the learner using standard exam styling.
* **Layout:** A dedicated, distraction-free environment that mimics a real exam dashboard, presenting one multi-choice question at a time.

### The Adaptive Learning Dashboard

* **Purpose:** The central workspace where the personalized lesson content and the real-time AI tutor interact.
* **Layout:** A **split-pane view** where the left side serves as the structured content feed and the right side houses the conversational assistant. on mobile it should feel like popping into view and should be Back-able, like android view/page navigation.

---

## Component Breakdown
### Global & Navigation Components

* **`AppHeader`**: Displays the application branding, authenticated user profile, and a global score tracker (e.g., "Current Module"). Has skeleton implemented in AppHeader.tsx.
* **`ProgressBar`**: A re-usable, linear indicator used in the Navbar during both the onboarding quiz and the main lessons to combat learner fatigue.

### Diagnostic & Content Components

* **`ConceptCard`**: A container that renders the AI-generated theory. It should support clean typography formatting (like headers, bolding, and blockquotes) and latex-like formulas for math content.
* **`QuizCard`**: Renders a single multiple-choice question. It takes the question text, an array of options, highlights the user's selection, and features a "Submit Answer" action.

### AI Conversational Components

* **`TutorDrawer` or `TutorSidebar**`: The container for the interactive chat. It remains collapsed or minimized until the user requests help.

* **`Chat`**: Renders messages with distinct styling differentiating the AI Tutor's responses from the student's typed messages. Has skeleton.

---

## The Onboarding & Diagnostic Workflow

This is the most critical sequence of the application. It must capture the user's profile, establish their starting state, and immediately trigger the first personalized lesson.

```
[ Account Creation ]
             │
             ▼
[ Interest Selector ] ──► (Saves interest arrays to User Profile)
             │
             ▼
[ Diagnostic Exam ] ──► (Evaluates answers)
             │
             ▼
[ State Generation ] ──► (Populates initial Mastery Matrix)

```

### Detailed Frontend Execution Steps:

#### Account Creation

* The user lands on a clean form to sign up or sign in.
* *Success Trigger:* Upon successful authentication, the frontend routes them to a protected `/onboarding` route and initializes a blank user record in the state management layer.

#### The Interest Selector

* The screen presents a clean grid of interactive cards or selectable items representing broad interest categories (e.g., *Sports, Music, Gaming, Technology, Cooking*).
* *Interaction:* The user must select at least one interest. Clicking an item adds it to a local state array.
* *Success Trigger:* Clicking "Continue" fires a quick update to the database, saving `interests: ["Gaming", "Esports"]` directly to the user's profile record. Mock this, no database yet.

#### The Diagnostic Exam

* The UI transitions to a clean, focused quiz layout. It pulls **2 to 3 pre-authored, static ENEM-style questions** directly from a local JSON curriculum file (not from the LLM, to ensure baseline stability).
* *Interaction:* The student answers the multiple-choice questions sequentially. The UI does *not* show them if they got the answers right or wrong during this phase, preventing discouragement.

#### Dashboard Handoff & The "First Paint"

* The onboarding router redirects the user to the main `/`.
* *The Magic Moment:* On page load, the dashboard reads the user's newly saved interest (e.g: `"Gaming"`) and their lowest mastered math node (e.g: `"Simple Probability"`).
* It automatically dispatches the initial background API request to the backend layer using these parameters. The UI displays a clean loading skeleton, which seamlessly transitions into their first completely customized math chapter.
