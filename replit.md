# Overview

This is a Brazilian lottery analysis application called "Shark Loto 💵" that uses artificial intelligence to analyze historical lottery data and predict optimal number combinations. The application supports three major Brazilian lotteries: Lotofácil, Mega-Sena, and Quina. It provides users with intelligent number generation, heat maps showing number frequency patterns, and comprehensive analysis of hot, cold, and mixed numbers based on historical draw data.

# User Preferences

Preferred communication style: Simple, everyday language.

## Interface Preferences
- All number generation strategy checkboxes (hot, cold, mixed) should be unchecked by default
- Users should have full control over which strategies to use
- No "Random Mode Activated" messages should be shown when no strategies are selected
- Interface should remain clean and minimal without unnecessary notifications

## Privacy and Security Preferences
- Winner notifications should protect user privacy by not showing names to other users
- Only the actual winner should see their own name in victory notifications
- Other users see anonymous "Someone won" messages
- No connection notifications should be shown when users connect to the real-time system

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

# Platform Compatibility and Deployment

The application features **complete multi-platform compatibility** with intelligent environment detection and automatic configuration for major hosting platforms.

## Supported Platforms

### Cloud Platforms
- **Replit** (primary) - Full-stack development with hot reloading
- **Vercel** - Serverless deployment with Edge functions
- **Netlify** - JAMstack deployment with serverless functions
- **Heroku** - Traditional PaaS deployment
- **Railway** - Modern cloud platform with Git integration
- **DigitalOcean App Platform** - Container-based deployment

### Container Deployment
- **Docker** - Containerized deployment for any platform
- **Docker Compose** - Multi-service orchestration

### Local Development
- **Node.js** - Direct local development and testing

## Migration System

The project includes an automated migration system that handles:

### Auto-Detection
- Automatic platform detection based on environment variables
- Intelligent configuration adjustment for each platform
- Dynamic resource allocation based on platform capabilities

### Migration Tools
- **Platform Migration Script**: `node scripts/migrate-platform.js <platform>`
- **Environment Configuration**: Automatic detection and setup
- **Documentation Generation**: Platform-specific deployment guides

### Configuration Features
- **Database Auto-Configuration**: SSL, connection pooling, and timeouts
- **Cache Optimization**: Platform-specific TTL and memory limits
- **CORS Setup**: Automatic origin configuration for each platform
- **Performance Tuning**: Request timeouts and resource limits
- **Feature Flags**: Platform-appropriate feature enabling/disabling

## Technical Optimizations

### Database Optimizations
- **Connection Pooling**: 20 connections on Replit, 5 on serverless platforms
- **Intelligent Caching**: 30-minute TTL on Replit, 15-minute on serverless
- **SSL Auto-Detection**: Automatic SSL configuration for production databases
- **Query Optimization**: Platform-specific query timeouts and retry logic

### Performance Enhancements
- **Memory Management**: Automatic cache clearing when memory usage exceeds thresholds
- **Resource Monitoring**: Real-time memory and CPU usage tracking
- **Error Recovery**: Automatic fallback mechanisms and self-healing capabilities
- **Load Balancing**: Intelligent request distribution and timeout handling

### AI System Optimizations
- **Adaptive Learning**: Learning frequency adjusts based on performance metrics
- **Pattern Detection**: Advanced statistical analysis with auto-correction
- **Cache Intelligence**: Multi-layer caching with TTL optimization
- **Error Handling**: Robust error recovery with automatic model correction

## Recent Technical Improvements (August 29, 2025)

### Startup Optimization
- **Fast Initialization**: Startup time reduced to under 3 seconds
- **Background Processing**: Non-blocking initialization of AI and data systems
- **Memory Monitoring**: Automatic memory cleanup and optimization
- **Graceful Recovery**: Intelligent error handling that prevents crashes

### AI Enhancements
- **Enhanced Learning**: Adaptive learning cycles based on performance
- **Pattern Analysis**: Advanced statistical modeling with real-time adaptation
- **Auto-Correction**: Self-healing algorithms that detect and fix anomalies
- **Performance Metrics**: Comprehensive tracking of AI accuracy and effectiveness

### Data Integration
- **Caixa API Integration**: Real-time lottery data with fallback mechanisms
- **Auto-Validation**: Data integrity checks with automatic correction
- **Retry Logic**: Intelligent retry mechanisms for API failures
- **Cache Layers**: Multi-tier caching for optimal performance

The application is now production-ready for deployment on any major cloud platform with automatic optimization and configuration.