# Health Insurance Coverage Analyzer - Development Guide

## Project Overview
This is a Next.js 15 application that helps users analyze health insurance coverage using AI. It parses Summary of Benefits and Coverage (SBC) PDFs and provides interactive analysis through AI-powered categorization and chat.

## Key Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Integration**: Multiple providers (Anthropic Claude, Groq) with retry logic
- **UI Framework**: @assistant-ui/react for chat interface
- **Validation**: Zod schemas
- **Runtime**: Bun (preferred) or Node.js 20+

## Architecture Patterns

### AI Model Strategy
The app uses a multi-model approach with sophisticated fallback logic:
- **Primary**: Anthropic Claude Sonnet 4 for complex analysis
- **Secondary**: Groq models for faster categorization
- **Fallback**: Automatic retry with temperature adjustment
- **Service Layer**: Centralized in `lib/services/insurance-ai-service.ts`
- **Caching**: In-memory caching for expensive operations
- **Error Handling**: Specialized error types and user-friendly messages

### Component Architecture (Refactored)
```
components/
├── ui/                      # shadcn/ui base components
├── assistant-ui/            # Chat interface components
├── error-boundaries/        # Error boundary components
│   ├── ai-error-boundary.tsx
│   └── general-error-boundary.tsx
├── policy-*.tsx             # Policy-specific components (refactored)
└── category-scores.tsx      # Insurance category display
```

### Custom Hooks Architecture
```
hooks/
├── use-category-analysis.ts    # AI category management
├── use-situation-suggestions.ts # Healthcare suggestions
├── use-insurance-settings.ts   # Centralized settings
└── use-mobile.ts              # Responsive utilities
```

### Service Layer Architecture
```
lib/services/
├── insurance-ai-service.ts    # All AI operations
├── policy-service.ts          # Policy parsing & management
└── index.ts                   # Service exports
```

### Data Flow (Refactored)
1. **PDF Processing**: Upload → Service Layer → Structured validation with Zod
2. **State Management**: Centralized with custom hooks + localStorage persistence
3. **AI Operations**: Service layer with caching, retries, and error handling
4. **Error Handling**: Error boundaries with graceful degradation
5. **UI Updates**: Hooks manage loading states and user feedback

## Development Best Practices (Refactored)

### Type Safety & Validation
- **Unified Schemas**: Use consolidated Zod schemas from `types/schemas.ts`
- **Type Exports**: Import types from schema file for consistency
- **Validation**: All AI responses validated with Zod schemas
- **Error Types**: Use custom error types (`InsuranceAIError`, `PolicyServiceError`)

### Component Architecture Best Practices
- **Separation of Concerns**: Use custom hooks for business logic
- **Error Boundaries**: Wrap AI components with `AIErrorBoundary`
- **Accessibility**: Include `title` attributes and ARIA labels
- **Loading States**: Always provide loading feedback for async operations
- **Responsive Design**: Use `useIsMobile` hook for mobile adaptations

### Custom Hook Patterns
- **Single Responsibility**: Each hook handles one domain (categories, settings, suggestions)
- **Error Handling**: Hooks handle their own error states and recovery
- **Caching**: Implement caching in hooks for better performance
- **Dependencies**: Proper dependency tracking to avoid unnecessary re-renders

### Service Layer Guidelines
- **Centralized Logic**: All AI operations go through service layer
- **Error Handling**: Consistent error types and user-friendly messages
- **Caching Strategy**: Implement intelligent caching with TTL
- **Fallback Logic**: Always provide fallback responses for AI failures
- **Type Safety**: Use Zod validation for all service inputs/outputs

### State Management (Refactored)
- **Policy Data**: React Context with localStorage persistence (`PolicyProvider`)
- **Settings**: Centralized with `useInsuranceSettings` hook
- **AI State**: Managed by domain-specific hooks (`useCategoryAnalysis`, etc.)
- **Error State**: Handled by error boundaries and custom hooks
- **Loading State**: Distributed across relevant hooks and components

## Key Files to Understand (Refactored)

### Service Layer (NEW)
- `lib/services/insurance-ai-service.ts` - Centralized AI operations with caching
- `lib/services/policy-service.ts` - Policy parsing, templates, and utilities
- `lib/services/index.ts` - Service layer exports and documentation

### Custom Hooks (NEW)
- `hooks/use-category-analysis.ts` - AI category management and navigation
- `hooks/use-situation-suggestions.ts` - Healthcare situation suggestions
- `hooks/use-insurance-settings.ts` - Centralized settings with persistence
- `hooks/index.ts` - Hook exports and usage documentation

### Error Handling (NEW)
- `components/error-boundaries/ai-error-boundary.tsx` - AI-specific error handling
- `components/error-boundaries/general-error-boundary.tsx` - General React errors
- `components/error-boundaries/index.ts` - Error boundary documentation

### Type System (REFACTORED)
- `types/schemas.ts` - Consolidated Zod schemas and type definitions
- `types/insurance.ts` - Legacy type exports (backward compatibility)

### Core Application (REFACTORED)
- `components/policy-analysis.tsx` - Main analysis interface (now uses hooks)
- `app/assistant.tsx` - Main app wrapper (now with error boundaries)
- `components/policy-context.tsx` - Policy data context provider

### Legacy (DEPRECATED)
- `actions/insurance-analyzer.ts` - Server actions (now thin wrappers)
- `actions/parse.ts` - PDF parsing (consider moving to service layer)
- `lib/ai-retry.ts` - AI retry logic (now part of service layer)

## Common Tasks (Refactored)

### Adding New AI Models
1. **Service Layer**: Add model configuration in `lib/services/insurance-ai-service.ts`
2. **Model Strategy**: Update `AI_MODELS` configuration object
3. **Fallback Logic**: Configure backup models and retry strategies
4. **Testing**: Test with different temperature settings and error scenarios

### Adding New Insurance Categories
1. **Service Layer**: Update prompts in `InsuranceAIService.generateCategories`
2. **Schema Validation**: Modify schemas in `types/schemas.ts` if needed
3. **UI Updates**: Category components automatically handle new categories
4. **Testing**: Test with various policy types and edge cases

### Extending PDF Parsing
1. **Service Layer**: Modify parsing logic in `lib/services/policy-service.ts`
2. **Schema Updates**: Update `ParsedPolicySchema` in `types/schemas.ts`
3. **Type Safety**: TypeScript will catch required UI updates
4. **Component Updates**: Update components that display new data

### Adding New Custom Hooks
1. **Hook Creation**: Create in `hooks/` following existing patterns
2. **Error Handling**: Include proper error states and recovery
3. **Type Safety**: Use types from `types/schemas.ts`
4. **Documentation**: Add comprehensive JSDoc comments
5. **Export**: Update `hooks/index.ts` with exports and usage docs

### Adding Error Boundaries
1. **Specialized Boundaries**: Create for specific error types if needed
2. **Error Reporting**: Integrate with monitoring services
3. **Fallback UI**: Design appropriate fallback interfaces
4. **Testing**: Test error scenarios in development

### Extending the Service Layer
1. **New Services**: Follow patterns in existing service files
2. **Error Types**: Create custom error classes for new domains
3. **Caching**: Implement caching for expensive operations
4. **Validation**: Use Zod schemas for all inputs and outputs
5. **Documentation**: Include comprehensive comments and examples

## Development Commands
```bash
# Development
bun run dev

# Build
bun run build

# Linting
bun run lint

# Fetch sample plans (development utility)
bun run fetch:plans
```

## Environment Variables Required
```
GROQ_API_KEY=           # For Groq AI models
ANTHROPIC_API_KEY=      # For Claude models
UNSTRUCTURED_API_KEY=   # For PDF parsing
BLOB_READ_WRITE_TOKEN=  # For file storage
TRIGGER_SECRET_KEY=     # For background jobs
```

## Testing Strategy
- Test AI operations with various PDF formats
- Validate category generation with different queries
- Test error handling with network failures
- Ensure responsive design across devices

## Performance Considerations
- AI operations can be slow (5-30 seconds)
- Implement proper loading states
- Consider caching AI responses
- Monitor API rate limits
- Use Bun for faster package management

## Security Notes
- All AI operations happen server-side
- PDF files are stored with public access (consider security implications)
- No sensitive user data is stored client-side
- API keys are server-only

## Debugging Tips
- Check browser console for client-side errors
- Monitor server logs for AI operation failures
- Use React DevTools for component state inspection
- Test with different PDF formats to ensure robustness

## Future Improvements
- Implement proper caching for AI responses
- Add user authentication and data persistence
- Optimize AI model selection based on query type
- Add comprehensive error recovery mechanisms
- Implement progressive web app features