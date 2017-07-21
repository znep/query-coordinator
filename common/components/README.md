# Common UI Components

This folder includes a collection of UI building blocks. You may have previously referred to this
collection as "Styleguide", though this name is not particularly accurate (the code within is an
_implementation_ of the Styleguide).

For information about the motivations around the philosophy of the Styleguide please read the [Frontend Components proposal](https://docs.google.com/document/d/1iozeArAm1QMDzZxMSmkBlJzyczGOQhV6MBfiNLbXpQ0).

See also: the [styleguide sample app](https://github.com/socrata/platform-ui/blob/master/styleguide-sample-app/README.md)

## Usage

Today we have two types of components in our repository
- Legacy components
- React components

### Prerequisites

If you're in frontend, the `styleguide` layout takes care of these prerequisites for you. In Storyteller, all existing
pages are already set up.

If you need to set up the prerequisites yourself:

1. Ensure you're pulling in `styleguide.scss` or `styleguide-no-tag-level.scss` in your page. See
the [styleguide css](https://github.com/socrata/platform-ui/blob/master/common/styleguide/README.md)
page for more information. Storyteller already does this via its `application.css`.
```erb
  <!-- frontend only -->
  <%= rendered_stylesheet_tag 'styleguide' %>
```
2. If you're in frontend, load jQuery in a _very specific_ way. Refer to `jquery_include` call in the [styleguide layout](https://github.com/socrata/platform-ui/blob/master/frontend/app/views/layouts/styleguide.html.erb). Storyteller should just work.
```erb
  <!-- frontend only -->
  <%# dotdotdot and velocity are finicky about jQuery. -%>
  <%# We made jquery an external, load it here and then bind it to window to be loaded into our Webpack bundle. -%>
  <%= jquery_include('2.2.4') %>
  <script type="text/javascript">window.jquery = window.jQuery;</script>
```
3. Get other prerequisites onto the page.
```erb
  <!-- frontend flavor-->
  <%= render_feature_flags_for_javascript %>
  <%= include_webpack_bundle 'site_wide/site_wide.js' %>

  <!-- storyteller flavor -->
  <%= render_feature_flags_for_javascript %>

```

Once prerequisites are taken care of, your next step is based on what kind of component you're using:

#### React Components - `common/components/`
These are written in React, jQuery, and lodash and are designed like any popular React component library
component. They have generic prop APIs that are used by downstream consumers. The Frontend Components proposal
mentioned at the start of this document explains two fundamental types of React components in Styleguide:
React versus React with Redux.

When it comes to styling React components, each is paired with an `index.scss` where component-specific
styles are added. These styles are then included in the final Styleguide style bundle and _not_ included
through anything such as `css-loader`.

Simply import any desired component from `common/components` and begin using it (if possible, avoid
directly importing a component. See example of discouraged behavior below).
For example, here's a sample using a Picklist:


```js
import { Picklist } from 'common/components';
$(() => {
    ReactDOM.render(
        <Picklist
          options={[
            {title: 'John Henry', value: 'john-henry'},
            {title: 'Railroads', value: 'railroads'},
            {title: 'Steel', value: 'steel'}
          ]} />,
        document.getElementById('root')
        );
    });
});
```

Avoid importing components directly if possible. Direct import dampens our ability to improve our
internal component file layout and implementation.

```js
import Picklist from 'common/components/Picklist'; // AVOID
...
```

#### Legacy components - `common/components/legacy`
These are written in vanilla JavaScript and are designed around the idea of binding to data attributes on DOM elements.
For example:
```html
<div class="container">
  <div data-flannel="flannel-id"></div>
  <div id="flannel-id" class="flannel"></div>
</div>
```
```js
new DropdownFactory(document.querySelector('.container'));
// Or attach the Styleguide legacy components to that section of the DOM:
styleguide.attachTo(document.querySelector('.container'));
// Or attach the Styleguide legacy components to everything on the page:
styleguide.attachTo(document);
```
These components are on their way out of the Styleguide, but can still be viewed in `common/components/legacy`.

## Styles

Styles (scss) are in a transitional state at the moment. The current recommendation is to put all styles
alongside the component's JS implementation under `common/components/$MY_COMPONENT/` and pull in the SCSS
via the styleguide style bundle at `common/styleguide/styleguide-no-tag-level.scss`. See the `Contributing`
section for more details. There are [proposals](https://github.com/socrata/rfcs/pull/1) for how to improve
this situation, but none are currently ready for implementation.

Written wholly in SCSS, these styles focus on general use tied to markup structure (either React components
with markup or simple markup).

There is a top-level `styleguide` stylesheet that is the entry point into `partials` and supported by
`variables`. See the `Usage` section to learn more.

### Importing styles into Storyteller

Use SCSS @import to add your stylesheet to `storyteller/app/assets/stylesheets/styleguide-shim.scss`.
Example:

```scss
@import 'common/authoring_workflow/authoringWorkflow';
```

You can't import the stylesheet with a Sprockets require because Sprockets is not aware of how
our icon font works. Our SCSS runtime, however, will handle this correctly. See the comments in
`styleguide-shim.scss` for more information.


### Importing styles into frontend

Our homegrown StylesController only looks for files in app/styles. Since our SCSS runtime
already knows how to pull in files from common/, it's hard to justify complicating StylesController.
The steps involved in importing a new stylesheet depends on if you want to add the styles to an
existing styles package in `style_packages.yml` or create a new style package which will include
only your new style.

#### Existing style package

Use an SCSS import in your existing stylesheet:

```scss
@import 'common/authoring_workflow/authoringWorkflow';
```

#### New style package

In this example, let's import a hypothetical style which lives in `common/add-blink-tag.scss`.

1. Create a shim in `frontend/app/styles/add-blink-tag-import-shim.scss`:

```scss
@import 'common/add_blink_tag.scss';
```

2. Define a new package in `style_packages.yml`.

```yml
add-blink-tag:
- add-blink-tag-import-shim
```

3. Use your style:

```erb
<%= rendered_stylesheet_tag 'add-blink-tag' %>
```

## Contributing

The easiest way to develop changes to `components` is to use a real application (such as frontend) as a test host for
your changes. A project to prepare the [styleguide sample app](https://github.com/socrata/platform-ui/blob/master/styleguide-sample-app/README.md)
for usage as a test host is underway but is not ready for use.

### Testing

All components must have tests for major functionality. Please place your tests in `common/spec`.

### Adding a new component/porting an existing component

*Side note*: We should add an example component just like our ExampleTest suite.

1. Ensure the component really belongs in `common`. See the [common top-level readme](https://github.com/socrata/platform-ui/blob/master/common/README.md)
  for more details.
2. Add your JS implementation under `common/components/$YOUR_NEW_COMPONENT/index.js`.
  You may add additional helper files alongside if you pull them in via `index.js`.
3. Add your styles under `common/components/$YOUR_NEW_COMPONENT/index.scss`.
  Again, you may add additional helper files alongside if you pull them in via `index.scss`.
  Please note we don't use css modules, so you will need to be careful with your style's
  specificity. It is recommended to wrap your styles with a top-level class selector. For
  instance, all the styles for `DateRangePicker` are wrapped with:
  ```css
  .date-range-picker {
    ...
  }
  ```
4. Export your new component via `common/components/index.js`. 
5. Pull in your styles via `common/styleguide/styleguide-no-tag-level.scss`
6. *Write your tests.*
7. Get a design review as outlined in the [common top-level readme](https://github.com/socrata/platform-ui/blob/master/common/README.md)
