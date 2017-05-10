# Packages

This subproject is responsible for generating distributable packages on an as-needed basis from common code.

Each subfolder represents a distinct package with possibly an associated README.md. Each package must handle its own build via jenkins jobs.

*IMPORTANT* Each package must manage its own dependencies.

## Common Tasks

### Building packages

Use the standard tools for the type of package.

  * For npm packages, use `npm package`
  * For gems, use `gem build package.gemspec`
