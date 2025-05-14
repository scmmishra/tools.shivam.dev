# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- **Start development server**: `pnpm dev` or `npm run dev`
- **Build for production**: `pnpm build` or `npm run build`
- **Preview production build**: `pnpm preview` or `npm run preview`

## Project Architecture

### Overview

This project is a collection of browser-based developer tools built with Vue 3, TypeScript, and Vite. Each tool is designed to run entirely in the browser without sending data to any server.

### Key Components

1. **Tool Registry (`src/tools.ts`)**
   - Central registry for all tools in the application
   - Each tool is defined with metadata (title, description, category)
   - Tools are organized into categories: Encoding, Security, CSS, Text, Dev

2. **Routing (`src/router.ts`)**
   - Dynamically generates routes based on the tool registry
   - Special route for decryption (/decrypt/:payload) with standalone mode

3. **Component Structure**
   - **ToolLayout**: Wrapper component for all tools providing consistent UI
   - **Form Components**: Reusable form inputs with persistence capability
   - **Result Component**: Standardized display of results with copy functionality

4. **Data Persistence**
   - `usePersist` composable for saving form values to localStorage
   - The components already use `usePersist` internally
   - Tools can specify which values to persist and offer clear functionality

5. **Command Palette**
   - Provides keyboard shortcuts (Cmd/Ctrl+K) for quick navigation between tools
   - Dynamically populated from the tool registry

### Core Architecture Patterns

1. **Single File Components**
   - Each tool is contained in a single Vue component with its own logic
   - Tools are added to the registry in `tools.ts` and automatically get routing

2. **Composable Patterns**
   - Uses Vue 3 Composition API
   - Shared functionality extracted into composables (e.g., usePersist)

3. **Client-Side Only**
   - All processing happens in the browser
   - No backend dependencies or API calls
   - Uses Web APIs for cryptographic operations when needed

## Design Language

The project follows a consistent design language with these key characteristics:

1. **UI Components**
   - `WithLabel.vue`: Consistent label styling for form elements
   - `TextInput.vue`, `NumberInput.vue`, `TextArea.vue`: Standardized form inputs
   - `Result.vue`: Unified result display with copy functionality
   - Monospace font for output/code displays

2. **Visual Style**
   - Minimal, clean interface with consistent spacing
   - Use tailwind for styling, only in light mode
   - Gray color palette with subtle outlines instead of heavy borders
   - Consistent button styling with hover states
   - Sharp corners instead of rounded ones
   - Simple transitions for interactive elements (like copy buttons)

3. **Interaction Patterns**
   - Copy functionality for results
   - Persistent form values using localStorage
   - "Clear saved data" option when persistence is enabled
   - Consistent form validation approach

When creating new components or modifying existing ones, strictly adhere to these design patterns to maintain visual and functional consistency across the application.

## Adding a New Tool

To add a new tool to the application:

1. Create a new Vue component in `src/pages/`
2. Import and register it in `src/tools.ts`
3. Add it to the appropriate category
4. Define metadata (title, description, icon, etc.)
5. Use the ToolLayout component for consistent UI
6. Use existing form components (TextInput, NumberInput, etc.) for inputs
7. Use the Result component for displaying outputs
8. Follow the established design language for any custom elements

The routing will be automatically handled based on the tool's slug in the registry.
