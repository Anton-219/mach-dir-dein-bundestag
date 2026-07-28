# Ticket 01: Bootstrap the New One-Page Application

## Goal

Create a clean React and TypeScript application in a separate repository folder that can serve as the foundation for the new static one-page presentation.

## Context

The existing prototype should remain untouched while the new page is built. The new application must be able to run independently and should start with the smallest useful structure possible.

## Scope

- Create a new application folder, for example `app-v2/`.
- Set up React, TypeScript, and Vite.
- Keep strict TypeScript settings enabled.
- Add only the scripts needed to develop and build the frontend.
- Add a minimal single-page application shell.
- Add a basic global stylesheet or CSS entry point.
- Display a temporary English heading and short placeholder text.
- Document the commands required to install, run, and build the new application.

## Implementation details

The new application should not import components or styles from the existing prototype. It should have its own `package.json`, TypeScript configuration, Vite configuration, entry point, application component, and styles.

Keep the initial component structure deliberately small. At this stage, a root `App` component and a small page shell are sufficient.

The folder should make it obvious which code belongs to the new implementation and which code belongs to the legacy prototype.

## Acceptance criteria

- A new frontend application exists in a separate folder.
- Running the documented install command succeeds from that folder.
- Running the development command opens a one-page React application.
- Running the production build command succeeds.
- The page displays an English project heading and no default Vite demonstration content.
- The new application does not depend on files from the existing `src/` component tree.
- No backend, API, router, state-management framework, or database dependency is introduced.
- The repository documentation identifies the new folder as the rebuild workspace.

## Out of scope

- Loading real election data.
- Porting calculations.
- Implementing filters.
- Implementing the final visual design.
- Removing or modifying the legacy application.

## Dependencies

None.
