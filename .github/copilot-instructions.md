# AIMD-L Project Proposal Manager Frontend

This document provides guidance for AI coding agents working on the AIMD-L (Automated Material Design Lab) project proposal management application.

## Project Overview

This is a Vue.js single-page application that serves as the frontend for managing project proposals submitted to AIMD-L. It allows users to define projects, associate them with people and samples, and track their progress. The application interacts with a separate backend service (Python/MongoDB) via a REST API.

## Architecture

- **Frontend:** Vue 3 with TypeScript, built using Vite.
- **Routing:** `vue-router` is used for navigation. See `src/router/index.ts`.
- **State Management:** `pinia` is used for global state management. Stores are located in `src/stores`.
- **Styling:** Component-scoped CSS is the primary method for styling.
- **API Communication:** All interaction with the backend is through a REST API. Create a dedicated service module (e.g., `src/services/api.ts`) to encapsulate `fetch` or `axios` calls.

## Core Concepts

- **Project:** The highest-level organizational unit. A project is initiated via a proposal and is assigned a unique identifier (DOI). It acts as a container for all related entities.
- **Collection:** There is a one-to-one mapping between a Project and a Collection in the backend. When a new project is created, a corresponding collection should be created via an API call.
- **Samples:** Represent physical materials. A key feature is that a single sample can be associated with multiple projects.
- **Groups & People:** The system manages users and their roles within project groups. It's handled via the backend API.

## Data Flow

1.  A user submits a new project proposal through a form in the application.
2.  It undergoes peer review and, upon approval, is converted into an active project.
3.  The frontend sends a request to the backend REST API to create a new project.
4.  The backend creates the project, assigns a DOI, and creates a corresponding collection and user group.
5.  The frontend provides views to link people, samples, and workflows to the newly created project.
6.  Dashboards will display project progress by fetching data from various API endpoints.

## Developer Workflow

- **Running the dev server:** `npm run dev`
- **Running tests:** `npm run test`
- **Building for production:** `npm run build`

## Key Files & Directories

- `src/views`: Contains the main page components for different routes (e.g., `ProposalView.vue`, `DashboardView.vue`).
- `src/components`: Contains reusable UI components.
- `src/router/index.ts`: Defines the application's routes.
- `src/stores`: Contains Pinia stores for managing global state (e.g., `userStore.ts`, `projectStore.ts`).
- `src/services`: A good place for API interaction logic. You should create this directory.

## Coding Conventions

- **Composition API:** Use the `<script setup>` syntax for all new components.
- **TypeScript:** Use TypeScript for all new code. Define interfaces for all API objects in a `src/types` directory.
- **State Management:** For any state that needs to be shared across components or pages, use a Pinia store. Do not rely on props/events for complex state sharing.
- **Error Handling:** Implement robust error handling for all API calls.
- **Testing:** Write unit tests for components and stores. Vitest is configured for this.
