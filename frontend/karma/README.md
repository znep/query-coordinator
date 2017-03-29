= Frontend Karma Tests

JavaScript tests for the frontend project.

== Organization

  Each test suite is represented as a folder within `frontend/karma/`).

== Configuration

  Test suites pull configuration from the following sources:

  === Webpack configuration

  * Project's webpack configuration in `frontend/config/webpack'
  * Karma-specific overrides in `frontend/karma/helpers/webpack.js`

  === Karma configuration

  * Global karma configuration in `frontend/karma/helpers/karma_config.js`
  * Project-specific overrides in `frontend/karma/PROJ_DIR/karma.conf.js`

== Adding a new test suite

  Assumptions: Your project is building correctly via webpack.

  1. Clone the `karma/exampleTestSuite` directory into a new folder.
  2. Edit the fields marked `UPDATE` in the cloned `karma.conf.js`.
  3. Edit the cloned `index.js` to set up any initial state required.
  4. Add your test suite to `frontend/lib/tasks/karma_tests.rake` (look for `ADD TEST SUITES HERE`).
  5. Write your tests (`index.js` defaults to running any files with the `Test.js` suffix).
