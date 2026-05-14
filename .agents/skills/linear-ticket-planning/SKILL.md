---
name: linear-ticket-planning
description: Convert rough implementation plans into concise Linear issue trees with explicit blockers and dependencies, optimized for autonomous coding agents.
---

# Linear Ticket Planning

Convert rough markdown plans into a structured Linear issue hierarchy that is ready for automated execution.

## Purpose

Use this skill when the user has a draft implementation plan and wants a token-efficient set of Linear issues with clear dependencies, blocking foundation tasks, and realistic agent-ready acceptance criteria.

## Workflow

1. Scan the repository for the high-level project context:
   - `plans/Project-Blueprint.md`
   - `plans/features.md`
   - `plans/implementation-plan.md`
2. If the user supplies rough markdown directly, use that as the primary source.
3. Identify unclear requirements. If anything is ambiguous, ask the user a focused clarification question before creating tickets.
4. Plan a concise issue hierarchy with:
   - Blocking foundation tickets first (DB/schema/core API)
   - Parallel implementation tickets next (UI, components, integration)
   - Final integration/testing tickets
5. Create the Linear issues with the MCP immediately after planning.
   - Create blocking issues first
   - Capture generated issue IDs
   - Use `blocks` / `blockedBy` relations for downstream tickets
6. Return a short summary of created issue URLs and the dependency tree.

## Hard Rules

- Do not write full code implementations inside tickets.
- Do not invent requirements. If ambiguous, use `Assumption: [...]` and keep it short.
- Optimize for brevity and agent readability.
- Always mention concrete file paths, schema shapes, API routes, or package names.
- Enforce TDD where applicable: acceptance criteria should require tests before implementation.
- Follow safe migration order: update consumers before removing old fields.
- Set explicit `Blocks` / `Blocked by` relations.
- Use Linear MCP to create the issues immediately after planning.
- Ask clarifying questions only when necessary.

## Issue Structure

For each ticket, use this dense issue format:

Labels: <backend, frontend, chore, spike, test>
Relations: Blocks:  | Blocked by:
Context: <1-2 sentences on why this exists>
Scope & AC:
- [ ] <testable criterion, include test-first behavior>
- [ ] <actionable criterion>
Tech Notes: <specific files, endpoints, packages>
Verification: <exact commands such as `npm run test`, `npx tsc --noEmit`>
Out of Scope: <1-2 points>

## Clarification Behavior

If the plan is missing key details, ask the user directly. Examples:
- "Should the session editor use `Dexie` live queries or in-memory state for the timer?"
- "Should boulder grades follow the existing `plans/drizzle-schema.ts` data model or a new `grade` table?"
- "Do you want the Linear issue tree to include separate tickets for accessibility and localization?"

If the user does not provide a clear answer, make a reasonable assumption and document it as `Assumption:` in the first ticket.

## Linear MCP Execution

After planning, execute the MCP call to create issues.

- Create foundation blockers first.
- Collect the returned Linear issue IDs.
- Create dependent tickets with explicit relations using those IDs.
- If the MCP supports parent/child, set parent relationships.

## Output

Return a concise summary with:
- Created Linear issue URLs
- Dependency tree
- Up to 3 important clarification questions or assumptions that were needed

## Notes

- If the repo contains `plans/Project-Blueprint.md` and `plans/features.md`, use them as the source of truth for architectural decisions.
- Prefer `plans/implementation-plan.md` for the rough feature plan when available.
- Do not make the issues themselves too verbose; keep each ticket focused and actionable.
