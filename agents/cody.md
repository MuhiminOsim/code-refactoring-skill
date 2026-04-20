# Setup: Sourcegraph Cody

## Via Custom Instructions

**VS Code:**
1. Open Cody panel → Settings → Custom Instructions
2. Paste contents of [`PROMPT.md`](../PROMPT.md)

**JetBrains:**
1. Settings → Tools → Cody → Custom Instructions
2. Paste contents of [`PROMPT.md`](../PROMPT.md)

## Via .cody/instructions.md (project-scoped)

```bash
mkdir -p .cody
curl -o .cody/instructions.md \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

Cody loads `.cody/instructions.md` automatically for the project.

## Usage

In the Cody chat panel:

```
Refactor the processOrder function

Extract the discount calculation into a separate function

This class is a god object — help me split it up
```

## Note

Cody's strength is its codebase-wide context (code graph). Combine this skill with `@codebase` context for large refactorings that span many files.

```
@codebase Refactor: extract a UserRepository from UserService
```
