# Socrata Visualizations

Visualizations that we can share between frontend projects.

## Usage

First, import the visualizations:
```javascript
import SocrataVisualizations from 'common/visualizations';
```

Importing SocrataVisualizations extends jQuery by adding plugins which can be used like this:

```javascript
$('.my-visualization').socrataColumnChart(vif);
```

Raw components may be accessed via the `views` and `dataProviders` keys of the
`SocrataVisualizations` object.

Include `visualizations-import-shim` in your package in `/frontend/config/style_package.yml` like so:
```yml
my-package:
- my-package/foo
- visualizations-import-shim
```

Storyteller and Visualization Embeds already load visualization styles so the above only applies to Frontend

## Examples

We maintain a list of example visualizations in the Internal Panel. See the links
[here](https://github.com/socrata/platform-ui/tree/master/#visualizations-example-pages).


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

Nothing special needs to be done - updates to this library will be deployed when the service using
it is deployed. Visualization embeds are sourced from frontend and will thus use its version of the
visualization code.

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

