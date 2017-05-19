# socrata-notifications

#### A React component that displays notifications in the [socrata_site_chrome](https://github.com/socrata/socrata_site_chrome) header

----

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

**Please take a look at the latest [Create React App Readme](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md) for info on the project's structure and available commands.**

----

## Dependencies

For development, [`json-server`](https://github.com/typicode/json-server) is used to fake data that would normally come from frontend:

    npm install -g json-server

Depending on your setup, you might have to add `json-server` to your `PATH`

(for me, I had to add `export PATH="/usr/local/Cellar/node/5.7.0/bin:$PATH"` to my `~/.zshrc`)

`"proxy": "http://localhost:3005"` was added to `package.json` so that any requests to i.e. `/notifications` proxy through to `json-server`.

## Available Scripts

In the project's root directory, you can run:

### `npm start`

Runs the app in development mode.

Runs `json-server` at [http://localhost:3005](http://localhost:3005) serving requests from `fake-frontend.json`

Runs the react app at [http://localhost:3006](http://localhost:3006) and opens the default browser

The page will reload if you make edits.

You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

See the ["Running Tests" section of the Create React App Readme](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance.

**Run `npm run build` inside the root directory of this project to re-build the files any time you make changes**

Refreshing the page should load with whatever changes were made.
