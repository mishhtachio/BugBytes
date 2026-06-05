# 🐛 BugBytes

BugBytes is a modern, high-contrast, cyberpunk-themed project management and issue-tracking platform designed for indie developers, hackathons, and agile teams. Built with a high-performance React/Vite frontend and a lightweight Express backend, BugBytes offers deep customization, git-workflow automation, and project-level collaboration.

---

## 🚀 Key Features

### Workspaces & Project Isolation
* **Access Control & Isolation**: Projects and issues are strictly isolated. Users can only view projects and issues they created or were explicitly invited to join.
* **Explore and Join**: A workspace explore panel allows team members to search for and join other public workspaces in the organization.
* **Project Invitations**: Creators can invite teammates to projects via email. If a user is not registered yet, they are added as a placeholder and automatically migrated to their Clerk profile upon registration.
* **Inbox Notifications Dropdown**: Interactive bell notifications in the header display pending project invitations, enabling instant acceptance or rejection.

### Project Roles
* Assign roles to project members (`Lead`, `Developer`, `Designer`, `QA`, `Product Manager`, `Member`).
* Project creators default to `Lead`, while joining users default to `Member`.
* Creators can dynamically reassign team roles from the project details panel.

### My Workspace (Personal Dashboards)
* **Sub-Tabs switcher**: Switch between the global **Project Board** and **My Workspace**.
* **Personal Metrics**: Cards displaying *Assigned Issues*, *Issues In Progress*, and *Personal Completion Rate*.
* **Visual Progress Bar**: A sleek purple-to-accent neon progress bar tracking your issue completions.
* **Assigned Issues List**: View issues assigned directly to you in the current project, with support for quick sidebar details editing.
* **Private Checklist Manager**: Keep private, project-specific, and user-specific To-Dos. Tasks are persisted to the database.

### Structured Tracking (Bugs vs Features)
* **Bugs**: Track bugs with Severity (*Critical*, *Major*, *Minor*) and Environment (*Production*, *Staging*, *Development*).
* **Features**: Track features with Scope (*Epic*, *Task*, *Improvement*) and Story Points (*1pt*, *2pt*, *3pt*, *5pt*, *8pt*).
* **Tag Capsules**: Press *Enter* to add custom tag capsules and clean `×` buttons to remove them.
* **List & Kanban Views**: Toggle views instantly. Includes color-coded priority indicators, green Done-issue formatting, and status transition confirmations.

### Git Commit & Pull Request Webhooks
* Built-in `/api/webhooks/git` endpoint listening for GitHub/GitLab events.
* **Commit Parsing**: Mentioning `#BB-001` transitions issues to *In Progress* and posts commits as comments. Prefixing with `Fixes`, `Resolves`, or `Closes` automatically marks issues as **Done**.
* **Pull Request Tracking**: Transitions issues to *Review* when a PR is opened, and to *Done* when merged.

### Premium UI Customization
* **Resizable Panels**: Adjustable left sidebar (`180px` to `450px`) and right sidebar (`260px` to `600px`) widths, saved automatically in localStorage.
* **Neon Swatches**: Set the global UI theme to cyber blue, neon green, electric cyan, hot pink, or purple rain.
* **Text Scaling**: Adjust overall font size and text scaling factor (*Small*, *Medium*, *Large*, *Extra Large*) for accessibility.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, Lucide React (Icons), CSS Variables (Cyberpunk Theme)
* **Authentication**: Clerk (Google, GitHub, and passwordless email password)
* **Backend**: Node.js, Express, Clerk Express Middleware (`@clerk/express`)
* **Database**: Flat-file JSON registry (`server/db.json`)

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Clerk Configuration
Create a project on [Clerk Auth](https://clerk.com/) and enable Google/GitHub social logins or email options. Take note of your publishable key and secret key.

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
# Frontend Config
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Backend Config
CLERK_SECRET_KEY=your_clerk_secret_key_here
PORT=3000
```

### 4. Install Dependencies
Install dependencies in both root and backend folders:

```bash
# Install root/frontend dependencies
npm install

# Install server/backend dependencies
cd server
npm install
cd ..
```

### 5. Running the Application
Run both backend and frontend servers:

```bash
# In the root folder: Starts the Vite frontend on http://localhost:5173
npm run dev

# In a separate terminal, from the server/ folder: Starts backend on http://localhost:3000
cd server
npm start
```

---

## 🧪 Git Integration Webhook (Testing commits locally)
To test Git commit triggers locally without setting up public endpoints:
```bash
curl -X POST http://localhost:3000/api/webhooks/git \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/main",
    "commits": [
      {
        "id": "abc12345",
        "message": "Closes #BB-001: Resolve database sync issue",
        "url": "https://github.com/example/repo/commit/abc12345",
        "author": { "name": "Hack Dev" }
      }
    ]
  }'
```

---

## 📂 Project Structure

```
├── server/
│   ├── db.json          # Database flat file
│   ├── index.js         # Express app server, routes, and webhooks
│   ├── loadEnv.js       # Preload environment variables prior to modules hoisting
│   └── package.json
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   └── AuthContext.tsx    # Clerk hooks mapper and apiFetch client
│   │   └── components/
│   │       ├── AuthPage.tsx       # Auth login and signup gate
│   │       └── Workspace.tsx      # Main application panel, boards, and sidebar
│   ├── styles/
│   │   └── theme.css              # Cyberpunk CSS tokens & variable configurations
│   ├── main.tsx
│   └── vite-env.d.ts
├── package.json
└── README.md
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
