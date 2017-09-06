# Socrata Platform Common Code

The `common` directory contains code modules that are shared between at least two services in this repo.
Each directory within `common` defines a reusable code module in either Ruby, JavaScript, CSS, or HTML.

Some examples of shared code found here are React components, Feature Flag utilities, and number formatters.

Please see the README within each folder to learn more:

* [Components (previously known as Styleguide](https://github.com/socrata/platform-ui/blob/master/common/components/README.md))
* [JS Utils](https://github.com/socrata/platform-ui/blob/master/common/js_utils/README.md)
* [Airbrake](https://github.com/socrata/platform-ui/blob/master/common/airbrake/README.md)
* [Analytics](https://github.com/socrata/platform-ui/blob/master/common/analytics/README.md)
* [Feature Flags](https://github.com/socrata/platform-ui/blob/master/common/feature_flags/README.md)
* [Site Chrome](https://github.com/socrata/platform-ui/blob/master/common/site_chrome/README.md)
* [Karma tests](https://github.com/socrata/platform-ui/blob/master/common/karma_config/README.md)

## Terminology

* Module: Unit of shared code in the `common` directory. Must live in its own subdirectory of `common`.

## File Structure

All files and folders in the `common` project must be snake_case (example: `common/feature_flags/flag_helpers.js`).
This is the least-surprising compromise between our rails-centric ruby codebase and our javascript codebase.

Important: A module's file structure is part of its public API! Keep this in mind when you are deciding your
module's structure.  It is highly recommended to define a single entry point for your module. That way, any
file renames or moves within the module do not affect consumers. It is also easier to provide fallbacks,
shims, or other iteration aids in this regime.

Prefer this:
```javascript
import { ColumnChart } from 'common/visualizations';
```
over this:
```javascript
import { ColumnChart } from 'common/visualizations/charts/column_chart';
```

You can see an example of this pattern [here](https://github.com/socrata/platform-ui/blob/master/common/visualizations/index.js).

## Module Requirements

*Note: This section will evolve as these structures are relatively young.*
*Note: Be responsible when changing these requirements. If your proposed change involves
making existing modules non-compliant, seriously consider your obligation to update
those existing modules.*

All modules, regardless of technology used, must satisfy these conditions:

0. Have a clear reason for being shared.
1. Have a clear snake_case name. For instance, `feature_flags`.
2. Define their implementation in `common/${MODULE_NAME}`.
3. Have a README.md in their folder.
4. Run a suite of tests when the `test` task is invoked from the shared Rakefile (`common/Rakefile`).
5. Run a linter when the `lint` task is invoked from the shared Rakefile (`common/Rakefile`).

## Contributing

When contributing a new module or modifying an existing one, please ensure your pull request
achieves the following:

1. Global checks pass (`rake test && rake lint` from the root of the repo).
2. Passes a design review with a senior-level or above engineer, if the change:
    1. Adds or removes a module.
    2. Adds, changes, or removes module API.
    3. Imports a new external library.
3. All usages of modified modules are updated to reflect the change, if applicable.
4. A demo is given of the changes in all relevant projects.

It is suggested that you consider these requirements _before_ you begin changing code. A series of small,
incremental changes is often preferable and faster to implement than a large, monolithic change that must
be merged all at once.

## Adding/updating NPM dependencies (styles or Javascript)

At the moment, NPM dependencies must be added in a few places. Consolidation work is planned but not implemented.
If you wish to add a new NPM package for use in `common` code, follow these steps:

1. Add your package to these `package.json` files:
    1. `common/karma_config/package.json`
    2. `frontend/package.json`
    3. `storyteller/package.json`
2. If the package includes styles, tell the SCSS runtimes about them by adding an include path to:
    1. `SCSS_LOAD_PATHS` in `frontend/app/controllers/style_controller.rb`.
    2. `getStyleguideIncludePaths` in `common/webpack/shared_config.js`.
    3. The `Rails.application.config.assets.paths` list in `storyteller/config/initializers/assets.rb`.
