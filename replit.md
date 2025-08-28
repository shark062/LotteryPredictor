# Overview

This is a Brazilian lottery analysis application called "Shark Loto 💵" that uses artificial intelligence to analyze historical lottery data and predict optimal number combinations. The application supports three major Brazilian lotteries: Lotofácil, Mega-Sena, and Quina. It provides users with intelligent number generation, heat maps showing number frequency patterns, and comprehensive analysis of hot, cold, and mixed numbers based on historical draw data.

# User Preferences

Preferred communication style: Simple, everyday language.

## Interface Preferences
- All number generation strategy checkboxes (hot, cold, mixed) should be unchecked by default
- Users should have full control over which strategies to use
- No "Random Mode Activated" messages should be shown when no strategies are selected
- Interface should remain clean and minimal without unnecessary notifications

# System Architecture

## Frontend Architecture

The frontend is built using **React 18** with **TypeScript** and follows a modern component-based architecture:

- **UI Framework**: Uses Radix UI components with shadcn/ui styling system
- **Styling**: TailwindCSS with a cyberpunk-themed design system featuring custom CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Component Structure**: Organized into reusable UI components, page components, and business logic components

The application features a responsive design optimized for both desktop and mobile devices, with a dark cyberpunk aesthetic using gradients, glow effects, and animated elements.

## Backend Architecture

The backend uses **Node.js** with **Express.js** in a full-stack TypeScript setup:

- **Framework**: Express.js with TypeScript for type safety
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Authentication integration with session management
- **API Design**: RESTful API endpoints with proper error handling and middleware
- **Services Layer**: Modular service classes for lottery operations and AI predictions

The server implements middleware for request logging, error handling, and authentication verification.

## Data Storage Solutions

**PostgreSQL** database with **Neon Database** as the cloud provider:

- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema Management**: Centralized schema definitions in `/shared/schema.ts`
- **Migration System**: Drizzle Kit for database migrations
- **Session Storage**: PostgreSQL-based session storage for authentication

Key database tables include:
- Users (for authentication)
- Lotteries (lottery game configurations)
- Lottery Results (historical draw data)
- User Games (user-generated number combinations)
- Number Frequency (statistical analysis data)
- AI Models (machine learning model data)

## Authentication and Authorization

**Replit Authentication** integration with session-based authentication:

- **Provider**: Replit's OpenID Connect (OIDC) authentication
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: HTTP-only cookies with secure flags
- **User Management**: Automatic user creation and profile management

The authentication system provides seamless integration with the Replit platform while maintaining security best practices.

## AI and Analysis Engine

Custom AI service for lottery number prediction and analysis:

- **Statistical Analysis**: Frequency analysis of historical lottery draws
- **Number Classification**: Categorizes numbers as "hot" (frequent), "cold" (rare), or "mixed"
- **Prediction Algorithm**: Generates optimized number combinations based on user preferences
- **Learning System**: Tracks AI accuracy and improves predictions over time

The AI system analyzes patterns in historical data to provide users with statistically informed number selections.

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL cloud database provider
- **Drizzle ORM**: Type-safe database toolkit and ORM

## Authentication Services
- **Replit Authentication**: OpenID Connect authentication provider
- **Express Session**: Session management with PostgreSQL store

## Frontend Libraries
- **React 18**: Core frontend framework
- **TanStack Query**: Server state management and caching
- **Radix UI**: Unstyled, accessible UI components
- **shadcn/ui**: Pre-built component library based on Radix UI
- **TailwindCSS**: Utility-first CSS framework
- **Wouter**: Lightweight client-side routing

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds

## UI and Styling
- **Lucide React**: Icon library
- **Class Variance Authority**: Utility for managing component variants
- **Tailwind Merge**: Utility for merging Tailwind CSS classes

The application is designed to be deployed on Replit with hot reloading in development and optimized builds for production.