# Copilot Instructions

These guidelines steer GitHub Copilot and other AI assistants contributing to this repository. They are intentionally concise—follow them unless a pull request or issue explicitly overrides them.

## Project Fundamentals

- **Stack:** TypeScript, React, Next.js (App Router).
- **Package Manager:** Yarn. Always use `yarn add` instead of `npm install`.
- **Styling:** CSS Modules in `*.module.css` files. Keep selectors scoped.
- **Assets:** Place static assets under `public/`.
- **Fonts:** Prefer existing fonts in `public/fonts/` before adding new ones.
- **XML Generation:** Use `xmlbuilder2` library instead of string concatenation for generating XML/MusicXML.

## Coding Guidelines

- Use functional React components with hooks; avoid class components. High-order components (HOCs) are couraged.
- Write all code comments, variable names, and function names in English, regardless of the prompt language.
- Do not modify files that are marked as read-only or protected.
- When instructed to preserve original code, add new code without changing existing code.
- Apply the most current syntax and language features available.
- Utilize existing library and framework features rather than creating custom implementations.
- **When modifying component styles, ALWAYS check component props/API first before modifying CSS.** Components often provide built-in props to control layout, size, spacing, etc.

## UX & Accessibility

- Support keyboard navigation for interactive elements.
- Response in chat must be English regardless of the prompt language.
- Label controls with accessible names (`aria-*` attributes) when semantics are not obvious.
- Keep color contrast accessible. Reuse palette from existing CSS modules.
- When adding styles (including fonts, colors, shadows), ensure they work for both light and dark themes, providing equivalent contrast and legibility.
- Using Yarn to manage packages, avoid adding new dependencies unless absolutely necessary. Prioritize lightweight libraries with minimal dependencies.

## Testing & Validation

1. Checkout current system type(Windows, Linux, MacOS), and also check shell type (bash, zsh, powershell, cmd) before running commands.
2. Always use Yarn for package management (`yarn add`, `yarn remove`, etc.).
3. Run `yarn lint` before opening a PR.
4. Add or update tests where functionality changes or new logic is introduced.
5. Validate responsive behavior in at least one mobile breakpoint (360px) and desktop (1280px).

## Documentation Expectations

- Update `README.md` or feature docs when behavior, setup, or dependencies change.
- Inline comments should explain *why* complex logic exists, not just *what* it does.

Following these conventions keeps the project healthy and consistent. Thanks for contributing! 🌱
