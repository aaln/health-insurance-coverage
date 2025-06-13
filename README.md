<div align="center">
  <h1 align="center">Health Insurance Coverage Analyzer</h1>
  <h3>AI-Powered Health Insurance Plan Analysis & Transparency</h3>
</div>

<div align="center">
  <a href="#-introduction">Introduction</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-good-use-cases">Good Use Cases</a> ·
  <a href="#-development">Development</a> ·
  <a href="#-feature-requests">Feature Requests</a> ·
  <a href="#-contributing">Contributing</a> ·
  <a href="#-getting-started">Getting Started</a>
</div>

## ✨ Introduction

**Health Insurance Coverage Analyzer** is an open-source project designed to help users understand, compare, and analyze their health insurance coverage. Upload your Summary of Benefits and Coverage (SBC) PDF, and the app will extract, structure, and analyze your plan using AI. Get clear, actionable insights into what your insurance covers, what it doesn't, and what you'll pay for common services—all with privacy in mind.

Whether you're a consumer, advocate, or developer, this project aims to make health insurance more transparent and accessible for everyone.


## 🚀 Features

| Feature | Description |
|---------|-------------|
| 📄 PDF Upload & Parsing | Upload your SBC PDF and auto-extract plan details |
| 🤖 AI-Powered Analysis | Coverage ratings, cost estimates, and recommendations for common healthcare situations |
| 🏷️ Interactive Category Explorer | Drill down into specific services, medications, or treatments and see detailed coverage info |
| 🧑‍💻 Policy Templates | Try the app instantly with built-in sample policies |
| 📊 Visual Summaries | See tables of covered, excluded, and other services |

## 🛠 Tech Stack

- [Next.js 15](https://nextjs.org/) – Framework
- [TypeScript](https://www.typescriptlang.org/) – Language
- [Tailwind CSS](https://tailwindcss.com/) – Styling
- [@assistant-ui/react](https://github.com/assistant-ui/assistant-ui) – AI Chat React UI Framework
- [shadcn/ui](https://ui.shadcn.com) & [magicui](https://ui.magicui.com) – UI Components
- [Anthropic, Groq](https://platform.openai.com/) – AI Models
- [Zod](https://zod.dev/) – Schema Validation
- [Bun](https://bun.sh) – Fast JS Runtime & Package Manager

## 📑 Good Use Cases

- Health insurance plan comparison and transparency
- Consumer education on insurance coverage
- Advocacy for better healthcare access
- Research on insurance plan features and gaps

## 🛠️ Development

This project includes comprehensive development guidelines and automation tools to ensure code quality and consistency.

### Cursor IDE Integration

This project includes comprehensive [Cursor IDE](https://cursor.sh/) rules for enhanced development experience:

#### Main Rules
- **[Global Rules](.cursor/rules/index.mdc)** - Core development standards and architecture patterns
- **[Server Actions](.cursor/rules/server-actions.mdc)** - Guidelines for Next.js server actions
- **[Self-Updating Rules](.cursor/rules/self-updating.mdc)** - Dynamic rule system that adapts to project changes

#### Background Agents
- **[Build Agent](.cursor/rules/agents/build.mdc)** - Automated build, linting, and formatting with `__NEXT_TEST_MODE="1"`

### Architecture Overview

The project follows a service-layer architecture pattern:

```
├── lib/services/           # Business logic and AI operations
├── components/             # React components with error boundaries
├── hooks/                  # Custom hooks for state management
├── types/schemas.ts        # Consolidated Zod schemas
├── actions/               # Server actions (thin wrappers)
└── .cursor/rules/         # Development guidelines and automation
```

### Key Development Principles

- **Service Layer First**: All AI operations go through `lib/services/`
- **Type Safety**: Zod schemas for all validation and type generation
- **Error Boundaries**: Graceful degradation with `AIErrorBoundary` components
- **Custom Hooks**: Single responsibility hooks for business logic
- **Named Exports**: Project preference over default exports

### Development Commands

```bash
bun run dev          # Development server
bun run build        # Production build
bun run lint         # ESLint checks
bun run fetch:plans  # Fetch sample data
```

### Code Quality

The project enforces strict TypeScript, comprehensive error handling, and uses multi-model AI fallback strategies. All AI responses are validated with Zod schemas, and the service layer provides caching and retry logic.

## 🙋‍♂️ Feature Requests

To request a new feature or suggest improvements, please [open an issue](https://github.com/YOUR_GITHUB_REPO/issues/new) on GitHub. All feedback is welcome!

## 😎 Contributing

This project is open-source and welcomes contributions from everyone. If you'd like to help, fork the repository and submit a pull request. Ideas, bug reports, and documentation improvements are all appreciated!

## 🏃‍♂️ Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 20+
- API keys for Groq, Anthropic (for AI features)

### 1. Clone the repository

```sh
git clone https://github.com/YOUR_GITHUB_REPO.git
cd health-insurance-coverage
```

### 2. Install dependencies

```sh
bun install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add your API keys:

```
GROQ_API_KEY=
ANTHROPIC_API_KEY=
UNSTRUCTURED_API_KEY=
BLOB_READ_WRITE_TOKEN=
TRIGGER_SECRET_KEY=
GOV_MARKETPLACE_API_KEY=
GOV_FINDER_API_KEY=
```

#### Obtaining CMS.gov API Keys

Note: the discovery section of the site won't work if these keys aren't available.

To get API keys for the CMS Healthcare APIs:

1. Visit [CMS Developer Portal](https://developer.cms.gov)
2. Click "Sign Up" to create a CMS Enterprise Portal account
3. For Marketplace API (GOV_MARKETPLACE_API_KEY):
   - Navigate to "Marketplace API" section
   - Click "Request Access"
   - Fill out the application form 
   - Submit and await approval

4. For Finder API (GOV_FINDER_API_KEY):
   - Navigate to "Finder API" section
   - Click "Request Access"
   - Complete similar application process
   - Specify intended usage for finding private health plans

### 4. Run the development server

```sh
bun run dev
```

### 5. Open the app in your browser

Visit [http://localhost:3000](http://localhost:3000) to get started.

---

**Health Insurance Coverage Analyzer** is built for the community, by the community. We hope you'll join us in making health insurance easier to understand for everyone!


