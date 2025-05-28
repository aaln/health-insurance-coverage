<div align="center">
  <h1 align="center">Health Insurance Coverage Analyzer</h1>
  <h3>AI-Powered Health Insurance Plan Analysis & Transparency</h3>
</div>

<div align="center">
  <a href="#-introduction">Introduction</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-good-use-cases">Good Use Cases</a> ·
  <a href="#-features-to-be-added">Features To Be Added</a> ·
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
```

### 4. Run the development server

```sh
bun run dev
```

### 5. Open the app in your browser

Visit [http://localhost:3000](http://localhost:3000) to get started.

---

**Health Insurance Coverage Analyzer** is built for the community, by the community. We hope you'll join us in making health insurance easier to understand for everyone!
