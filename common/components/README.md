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

First, ensure you're pulling in `styleguide.scss` or `styleguide-no-tag-level.scss` in your page. See
the [styleguide css](https://github.com/socrata/platform-ui/blob/master/common/styleguide/README.md)
page for more information. Once that is complete, your next step is based on what kind of component you're using:

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
