## High-level Design
This section calls out the intended structure of our Styleguide. Think of it as a _What's in here?_ document.

For information about the motivations around the philosophy of the Styleguide please read the [Frontend Components proposal](https://docs.google.com/document/d/1iozeArAm1QMDzZxMSmkBlJzyczGOQhV6MBfiNLbXpQ0).

#### JavaScript
Today we have two types of components in our repository
- Legacy components
- React components

##### Legacy components - `src/js`
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
```
These components are on their way out of the Styleguide, but can still be viewed in `src/js`.

##### React Components - `src/js/components`
These are written in React, jQuery, and lodash and are designed like any popular React component library component. They have generic prop APIs that are used by downstream consumers.
For example:
```js
import Dropdown from 'socrata-components/components/Dropdown';

export default (props) => <Dropdown options={props.options} />;
```
The Frontend Components proposal mentioned at the start of this document explains two fundamental types of React components in Styleguide: React versus React with Redux.

When it comes to styling React components, each is paired with an `index.scss` where component-specific styles are added. These styles are then included in the final Styleguide style bundle and _not_ included through anything such as `css-loader`.

#### Styles
Written wholly in SCSS, these styles focus on general use tied to markup structure (either React components with markup or simple markup).

There is a top-level `styleguide` stylesheet that is the entry point into `partials` and supported by `variables`.

##### Partials - `src/scss/partials`
These partials are directly related to markup only. For React component styling, check out the React Components subsection above. The type of component informs the name of your new partial. For example, if you're adding a Hero container, you'd add a partial called `_hero.scss`.

##### Variables - `src/scss/variables`
These are normal SASS variables shared across all partials and in React component styles.

#### Documentation - `docs`
This is where we keep our Github pages ERB templates. It's broken into several sections:
- Elements
  - These are partials that aren't JavaScript-driven.
- Layouts
  - Master and prototypal layouts.
- Legacy
  - These are partials for `src/js/*.js`.
- Components
  - These are partials for `src/js/components/**/*.js`

You can style the documentation directly through `docs/stylesheets/docs.scss`

#### Prototyping - `docs/prototypes`
Prototypes are fully-featured layouts used to inform product decisions and serve as a template for developers. They can be viewed at http://localhost:4567/prototypes/my-prototype/index.html.
Stylesheets for prototypes are located in `docs/stylesheets/prototypes`.
