# Socrata Visualizations

Visualizations that we can share between frontend projects.

## Usage

`socrata-visualizations` is available in the artifactory npm registry.  To configure npm to use the
appropriate registry:

```sh
npm config set registry https://socrata.artifactoryonline.com/socrata/api/npm/npm-virtual
```

Then install using npm:

```sh
npm install --save socrata-visualizations
```

The npm distribution includes a `dist` folder with `socrata-visualizations.js` and
`socrata-visualizations.css`.  Both should be included on the page using `script` and `link` tags or
using your favorite client-side build system.

jQuery components are installed as jQuery plugins, which can be used like this:

```javascript
$('.my-visualization').socrataColumnChart(vif);
```

Raw components may be accessed via the `views` and `dataProviders` keys of the
`socrata-visualizations` object.  This object is available on the window
(`window.socrata.visualizations`) or by requiring it (`require('socrata-visualizations');`).

This library depends on [frontend-utils](https://github.com/socrata/frontend-utils),
[D3](http://d3js.org), [Lodash](https://lodash.com), and [jQuery](https://jquery.com). When using
this library as a dependency in another project, you must also include the non-Socrata libraries in
your dependencies because they will not be automatically installed.

## Pre-requisites

> You must fist setup artifactory credentials in order to allow `npm` to resolve dependencies. See the `setup-environment.sh` script in the `frontend` repo for more information.

```
npm install
```

Here are the versions we use for externals, which are not included in the webpack bundle:

- `d3` - 3.5.6
- `leaflet` - 0.7.3
- `lodash` - 3.10.0
- `jquery` - 2.1.1
- `vector-tile` - 0.1.1
- `moment` - 2.10.6
- `chroma-js` - 0.5.6
- `simple-statistics` - 0.8.1

## Useful commands

- `npm test` to run the tests.
- `npm run lint` to run the linter.
- `npm run watch` to automatically run the tests when files change.  The tests can be debugged in
  a browser by visiting http://localhost:9876/debug.html.
- `npm run build` to run webpack and generate output files in `dist`.
- `npm run release` to tag and publish a new version to the npm registry (after bumping the
  version in `package.json`).

## Examples

The `examples` directory contains demos that show how each supported visualization can be consumed.

## Embeds

In addition to building library code, this project also generates standalone artifacts used for embedding
visualizations on non-socrata sites. See this [design document](https://docs.google.com/document/d/1-YbnPvT3HOPM_bLytye2-UDz6hOJcT7taLa39pDP4to/edit#)
for full details or read the summary below.

Users wishing to embed a Socrata visualization will be given an “embed code”, which consists of the visualization’s VIF and script tag pointing to a bootstrap script. The bootstrap script will load the full visualization library package from a remote server and call into it. The viz package will then replace the embed code with a full visualization.

The visualization itself will be rendered natively on the page instead of using an iframe-based approach. The advantages afforded by this strategy were found to outweigh the risks and disadvantages (see technical details section).

Note that since the customer’s page only hosts minimal bootstrap code and not the full library, we retain full control of the rendering strategy. If we find some visualizations are better suited to iframe rendering, we can deploy a new revision of the package that makes the requisite changes.

There are two artifacts that are used in the embed process:

- `dist/socrata-visualizations-loader.js`:
  Minimal loader. This is directly referenced by the customer's site. Its job is to
  select the correct assets to pull in and load them in an idempotent way.
- `dist/socrata-visualizations-embed.js`:
  Main bundle. When loaded, this will render visualizations into the DOM tree based
  on where the customer placed the embed code.
  This package is self-contained - it provides all the markup, styles, and javascript
  necessary for visualizations to work correctly.

Embed codes are generated via a helper in `embedCodeGenerator.js`.

### Deploying Updates

The active embed version is managed by frontend via a marathon configuration. Staging is always on the latest
version (master branch). Production and RC are fixed to a particular version.

To update the version of embeds in RC or production, edit [frontend.json](https://github.com/socrata/apps-marathon/blob/master/resources/frontend.json) in `apps-marathon`. Update the version numbers at the end of the URLs
specified in these keys:

* `SOCRATA_VISUALIZATIONS_V1_EMBED_URL`
* `SOCRATA_VISUALIZATIONS_V1_LOADER_URL`

For example, to use version 1.2.3, use:

```json
    "SOCRATA_VISUALIZATIONS_V1_EMBED_URL": "https://s3.amazonaws.com/sa-frontend-static-assets-us-east-1-fedramp-prod/socrata-visualizations/socrata-visualizations-embed-1.2.3.js",
    "SOCRATA_VISUALIZATIONS_V1_LOADER_URL": "https://s3.amazonaws.com/sa-frontend-static-assets-us-east-1-fedramp-prod/socrata-visualizations/socrata-visualizations-loader-1.2.3.js",
```

Verify the URLs load in your browser. Once you are confident you don't have any typos, refresh the frontend
configuration in your target environment. For instance, to refresh RC, do the following from `apps-marathon`:
```sh
rake "marathon:app:refresh[frontend, rc]"
```

Once the deploy is complete, commit and push your changes to `apps-marathon`.

You can verify embeds against RC on this [demo page](http://socrata-embed-testing.blogspot.com/2017/02/blog-post.html).

### Debugging Embeds

If you need to debug or work on embeds on a 3rd party site, you can cause the embeds to be sourced from your local stack by following these steps:

Your first order of business is to prevent the non-dev version of socrata-visualizations from loading.

  1. Visit the site in need of work and enable "break on script first statement". For chrome dev tools:

    1. In the Sources pane, expand `Event Listener Breakpoints`, then `Script`.
    2. Check `Script First Statement`

  2. Reload the page.
  3. When the breakpoint is hit, run this script to disable the loader, then continue loading the page (disable the breakpoint too). You shouldn't see any visualizations load.
```javascript
// Purposefully inject a 404-ing script tag. This will cause
// the existing loaders to think the embeds have already loaded.
var scriptTag = document.createElement('script');
scriptTag.type = 'text/javascript';
scriptTag.async = true;
scriptTag.src = 'https://localhost/doesnt-exist/socrata-visualizations-embed.js';
document.head.appendChild(scriptTag);
```

Your next step depends on what you're needing to debug.

*Debugging the loader*

This one's easy.
  1. Compile your sources (`npm run webpack`).
  2. Remove all loaders from the page so you can load your own stuff:
    `Array.from(document.querySelectorAll('script[src*=socrata-visualizations')).map(function(e) { e.remove(); })`
  3. Copy-and-paste the contents of `dist/socrata-visualizations-loader.js` into the console.

*Debugging the visualizations themselves*

1. Compile (`npm install && npm run webpack`). Run `npm run test-http-server` and wait for the server to come up.
2. In the browser you'll be using, visit [this page](https://localhost:9874/) in another tab and accept the SSL cert warning.
3. Run this in the console:
```javascript
var scriptTag = document.createElement('script');
scriptTag.type = 'text/javascript';
scriptTag.async = true;
scriptTag.src = 'https://localhost:9874/socrata-visualizations-embed.js';
document.head.appendChild(scriptTag);
```

*Both at once*

Follow the steps for "Debugging the visualizations themselves", but stop short of creating the script tag. You'll now need to modify `mainLibrarySrc` in `src/embed/paths.js` to always return `https://localhost:9874/socrata-visualizations-embed.js`. Compile, then follow the steps above in "Debugging the loader".

