<div align="center">

# 📘 SmartNotes AI

**Your AI-Powered Study Companion**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Transform your learning experience with intelligent document processing, AI-generated quizzes, and collaborative study features.**

</div>

## 🌟 Overview

SmartNotes AI is a cutting-edge educational platform that revolutionizes how students interact with study materials. By leveraging advanced AI technologies, it transforms static documents into interactive learning experiences through intelligent processing, contextual Q&A, automated quiz generation, and collaborative study environments.

### 🎯 Key Objectives
- **Enhanced Comprehension**: AI-powered analysis helps students understand complex materials
- **Active Learning**: Automated quizzes and interactive features promote engagement
- **Collaborative Study**: Real-time sessions enable peer learning and knowledge sharing
- **Progress Tracking**: Comprehensive analytics help students monitor their learning journey

## 🚀 Features

### 📄 Smart Document Processing
Transform any PDF, DOC, or TXT file into an AI-ready knowledge base:
- **Intelligent Text Extraction**: Advanced parsing for clean, structured content
- **AI Vectorization**: Convert documents into searchable knowledge vectors
- **Auto-Categorization**: Smart tagging and subject assignment
- **Content Summarization**: Generate concise summaries for quick review

### 💬 AI-Powered Q&A System
Get instant, contextual answers to your study questions:
- **Document-Based Responses**: Answers derived directly from your uploaded materials
- **Follow-Up Suggestions**: AI-generated related questions for deeper exploration
- **Real-World Examples**: Contextual examples to enhance understanding
- **Confidence Scoring**: Know how reliable each answer is with confidence indicators

### 🧠 Automated Quiz Generation
Create personalized quizzes from your documents:
- **Adaptive Difficulty**: Questions tailored to your learning level
- **Multiple Formats**: Multiple-choice, short-answer, and essay questions
- **Time Constraints**: Customizable time limits for focused practice
- **Performance Analytics**: Track quiz scores and improvement over time

### 👥 Collaborative Study Sessions
Study together, even when apart:
- **Real-Time Chat**: Instant messaging with study partners
- **Document Sharing**: Collaborative access to uploaded materials
- **Group Learning**: Multi-user study environments for peer interaction
- **Session History**: Review past collaborative sessions

### 📊 Progress Tracking & Analytics
Monitor your learning journey with comprehensive insights:
- **Study Time Metrics**: Track hours spent on different subjects
- **Performance Trends**: Visualize quiz scores and improvement patterns
- **Streak Counters**: Maintain motivation with daily study streaks
- **Goal Management**: Set and track weekly learning objectives

### 🏆 Achievement System
Celebrate milestones with a rewarding badge system:
- **Study Milestones**: Recognition for consistent learning habits
- **Quiz Mastery**: Badges for quiz performance achievements
- **Collaboration Rewards**: Recognition for active participation in study groups
- **Progress Indicators**: Visual feedback on learning advancement

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | [Next.js 15](https://nextjs.org) | App Router, SSR, and optimized performance |
| **Language** | [TypeScript](https://www.typescriptlang.org) | Type safety and enhanced developer experience |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) | Accessible, customizable UI components |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first CSS framework |
| **Icons** | [Lucide React](https://lucide.dev) | Beautiful, consistent iconography |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Form validation and management |
| **Database** | [Supabase](https://supabase.com) | PostgreSQL with Row Level Security |
| **Authentication** | Custom JWT-based service | Secure user authentication and sessions |
| **State Management** | React Context API | Application state handling |
| **Notifications** | [Sonner](https://sonner.emilkowal.dev) | Toast notifications |
| **AI Integration** | [OpenAI API](https://openai.com) | Natural language processing and generation |

## 📁 Project Architecture

```
src/
├── app/                    # Next.js App Router structure
│   ├── api/                # API routes for backend functionality
│   │   ├── auth/           # Authentication endpoints
│   │   ├── chat/           # AI chat and session management
│   │   ├── documents/      # Document processing APIs
│   │   └── quizzes/        # Quiz generation and management
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Main dashboard with feature modules
│   └── subjects/           # Subject management interface
├── components/             # Reusable UI components
│   ├── auth/               # Login and registration components
│   ├── dashboard/          # Dashboard layout and navigation
│   ├── documents/          # Document management UI
│   ├── layout/             # Core layout components
│   └── ui/                 # shadcn/ui component library
├── contexts/               # React context providers
│   └── AuthContext.tsx     # Authentication state management
├── lib/                    # Business logic and services
│   ├── ai-service.ts       # AI integration layer
│   ├── api-client.ts       # API communication utilities
│   ├── api-utils.ts        # API helper functions
│   ├── auth.ts             # Authentication service
│   ├── chat-session-service.ts # Chat session management
│   ├── documents-service.ts # Document processing service
│   ├── quizzes-service.ts   # Quiz generation service
│   ├── setup-db.ts         # Database initialization
│   ├── storage.ts          # Local storage utilities
│   └── subjects-service.ts # Subject management service
└── types/                  # TypeScript definitions
    └── index.ts            # Core data models and interfaces
```

## 🎯 Core Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
}
```

### Subject
```typescript
interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Document
```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'note' | 'study-guide';
  subjectId: string;
  userId: string;
  fileUrl?: string;
  extractedText?: string;
  isProcessed: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Quiz
```typescript
interface Quiz {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  userId: string;
  questions: Question[];
  timeLimit?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### StudySession
```typescript
interface StudySession {
  id: string;
  title: string;
  subjectId: string;
  userId: string;
  participants: string[];
  isActive: boolean;
  sharedDocuments: string[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
```

## 🏃 Development Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)
- [Bun](https://bun.sh) package manager
- [Supabase](https://supabase.com) account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartnotes-ai
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Update environment variables as needed
   ```

4. **Database initialization**
   ```bash
   bun run setup-db
   ```

### Running the Application

```bash
# Development mode
bun dev

# Production build
bun run build

# Production server
bun run start
```

The application will be available at `http://localhost:3000`

## 🧪 Testing AI Features

1. **Document Upload**
   - Navigate to Dashboard → Documents
   - Upload a PDF or create a text note
   - Wait for AI processing (simulated in mock version)

2. **AI Chat Interaction**
   - Go to Dashboard → AI Chat
   - Ask questions about your uploaded documents
   - Explore suggested follow-up questions

3. **Quiz Generation**
   - Visit Dashboard → Quizzes
   - Create a new quiz from your documents
   - Customize difficulty and time settings

4. **Progress Monitoring**
   - Check Dashboard → Progress for analytics
   - Review Dashboard → Achievements for badges

## 🔐 Security Implementation

### Row Level Security (RLS)
Supabase database implements RLS to ensure users only access their own data:

```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own documents"
  ON documents FOR ALL USING (user_id = auth.uid());
```

### Authentication Flow
1. JWT-based session management
2. Secure token refresh mechanisms
3. Protected API routes with middleware
4. Client-side localStorage for mock persistence

### CORS Configuration
Proper CORS headers configured for iframe embedding:
```typescript
headers: [
  {
    key: "Access-Control-Allow-Origin",
    value: "*", // Restricted in production
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self' *",
  },
]
```

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.2.4 | Framework |
| `react` | 19.x | UI Library |
| `typescript` | 5.x | Type Safety |
| `tailwindcss` | 4.x | Styling |
| `lucide-react` | 0.454.0 | Icons |
| `@radix-ui/*` | latest | UI Components |
| `react-hook-form` | 7.x | Form Handling |
| `zod` | 3.x | Validation |
| `openai` | 5.x | AI Integration |
| `pdfjs-dist` | 5.x | PDF Processing |
| `mammoth` | 1.x | DOCX Processing |
| `recharts` | 2.x | Data Visualization |
| `sonner` | 1.x | Notifications |

## 🚧 Development Guidelines

### Component Architecture
- Use `"use client"` directive for client components
- Implement Suspense boundaries for async components
- Follow shadcn/ui component patterns for consistency
- Maintain proper TypeScript typing

### State Management
- Prefer React Context for global state
- Use localStorage for mock persistence
- Implement proper loading and error states

### Error Handling
- Wrap components with appropriate error boundaries
- Provide user-friendly error messages
- Log errors for debugging purposes

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Test across different screen sizes
- Ensure accessibility compliance

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy with zero configuration

### Manual Deployment
```bash
# Build for production
bun run build

# Start production server
bun run start
```

### Docker Deployment
```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

### Code Review Process
- All PRs require review from maintainers
- Automated tests must pass
- TypeScript compilation must succeed
- ESLint and formatting checks applied

## 📞 Support

For support, please:
- Open an issue on the GitHub repository
- Contact the development team
- Check the documentation for common issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for students everywhere**

</div>
