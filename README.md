# 📚 Contextual AI Learning Platform

This is a full-stack application (written in Django and React) designed to offer an intelligent and adaptive learning experience. While the user consumes educational materials or solves exercises, they have access to a sidebar containing an **integrated AI Agent**. This agent has exact awareness of the student's current context, allowing it to provide highly personalized assistance, explanations, and information based on what is being viewed or done on the screen.

## 🎯 Project Assumptions

* **Target Audience and Pedagogical Focus:** The project assumes that the end user entered the platform with the goal of learning and mastering concepts involving **Statistics, Probability, and Graph Analysis**.
* **Real Dataset:** A dataset with real questions from **ENEM** (Brazilian High School National Exam) was used, as it is the material recommended by the rules.
* **Content Flexibility:** The application uses Markdown to render educational material. It was architected to work with any discipline or type of content. For demonstration purposes, the database was initially populated with a mock statistics and probability dataset stored in `back/lessons/`.

## 🚀 Onboarding Flow (User Experience)

When a new user creates an account and enters the application for the first time, they go through an AI-guided onboarding process:

1. **Interactive Placement Interview:** The AI presents a short summary of each available topic. The user interacts by indicating which themes and modules they already master or feel comfortable with, and which ones they do not.
2. **Learning Profile Customization:** The user defines their study preferences (e.g., whether they prefer explanations based on analogies, more technical language, practical examples, etc.). The AI saves this profile to shape the behavior of the contextual agent in the sidebar.
3. **Initial Mock Exam (Practical Placement):** After the interview, the system directs the user to a testing screen where they take **5 quick ENEM-style questions** to practically assess their real level of knowledge.

## 🛠️  Installation and Setup

### Prerequisites

* **Docker** installed on the machine.
* A **Gemini** (Google) API key, which can be obtained for free at [Google AI Studio](https://aistudio.google.com/projects).

### Setup and Initialization Steps

1. Navigate to the backend folder:
```bash
cd back

```


2. Create the `.env` file based on the available example file:
```bash
cp .env.example .env

```

3. Open the generated `.env` file and insert your Gemini key.
4. Return to the project root (where the `docker-compose.yml` file is located) and initialize the containers by running:
```bash
docker compose up -d --build

```



### 🔐 Accessing the Application

After building and initializing the Docker containers:

* The Frontend will be available at: **`http://localhost:5173`**
* **Default user:** `admin@email.com`
* **Default password:** `admin`

## 🏗️ Architecture and Data Structure

### 🧠 Use of Artificial Intelligence

The core of the personalization lies within the interactive sidebar. The agent consumes the context in real time (whether reading a text or solving an ENEM question) to ensure accurate responses, acting as an integrated private tutor that understands exactly what the student's doubt is, and doing its best to guide and teach without simply giving away the answer.

### 💾 Content Flow and Storage

Unlike a structure that reads files at runtime, the ecosystem stores everything persistently:

1. **Initial Load:** Text materials (structured in Markdown) and module dependencies (structured in JSON) are read locally by the Backend only during initialization/seeding.
2. **Database Persistence:** The raw content in **Markdown is stored directly inside the Database**.
3. **Dynamic Consumption:** The Frontend consumes the Markdown texts and structures directly from the DB. This makes the application agnostic to the original import format.

### ⚖️ Choices and Trade-offs

* **Fragmented Context Injection:** Due to the short development deadline, context communication between the Frontend and the AI Agent was not centralized. Currently, each route/screen has its own custom logic to inject data into the conversation.
* **Weak Typing in Context Flow:** This manual coupling resulted in a flow that is not strongly typed, bringing the technical risk of inconsistencies should the AI model deviate from the expected format (*schema*) on specific routes.
* **Greedy Placement Algorithm:** For calculating the user's level in the mock exam, a strict/greedy algorithm was adopted. If the user misses any question of a level $X$, the system summarily removes the possibility of them being at that level or above, which can generate a severe penalty for silly mistakes or lapses in attention.
* **Absence of Creator Interface:** Due to scope and time constraints, a visual tool for teachers or content editors to create new content was not developed. Currently, loading new lessons and prerequisite rules still depends on the Backend previously reading the Markdown/JSON files to feed the database.

## 🚀 Next Steps (Improvements with More Time and Resources)

Should the project have more resources or time for evolution, the following priority improvements have been mapped out:

1. **Context Centralization and Rigid Validation:** Refactor Frontend-Agent communication to unify data injection. Implement strict data contracts in the Backend, eliminating the risk of layout or flow breakages.
2. **IRT-Based Evaluation Algorithm (Item Response Theory):** Replace the greedy algorithm with a more robust statistical model (such as the ENEM's own IRT), which evaluates the consistency of the user's answers and does not penalize them drastically for a single isolated mistake.
3. **Visual Curriculum Grid Interface (Drag and Drop):** Develop an administrative area where teachers and editors can create content and, most importantly, define the dependency tree between topics and modules visually (dragging and dropping elements on the screen), completely eliminating the need for JSON configuration files to map out the curriculum grid.
