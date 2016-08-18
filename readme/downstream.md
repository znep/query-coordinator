## Usage
With [artifactory](https://docs.google.com/document/d/1KihQV3-UBfZEOKIInsQlloESR6NLck8RuP4BUKzX_Y8) set up on your system, run:
```
npm install --save socrata-components
```

### JavaScript

#### Inclusion through HTML
All of the bundled Styleguide assets are located in `dist` and should be loaded on your page through normal means. For example:

```html
<!-- JavaScript component styles -->
<link href="node_modules/socrata-styleguide/dist/css/styleguide.min.css" rel="stylesheet">

<!-- JavaScript vendor dependencies -->
<script type="text/javascript" src="https://npmcdn.com/react@15.1.0/dist/react.js"></script>
<script type="text/javascript" src="https://npmcdn.com/react-dom@15.1.0/dist/react-dom.js"></script>
<!--  JavaScript components -->
<script type="text/javascript" src="node_modules/socrata-styleguide/dist/js/socrata-components.min.js"></script>
```

> Note:
> Keep in mind that allowing direct access to `node_modules` is bad practice.
> Do what makes sense for you project's structure.

With `window` global usage:

```js
const Component = React.createClass({
  render() {
    return <styleguide.ColorPicker id="my-awesome-color-picker"/>;
  }
});
```

#### Inclusion through Webpack
Running the installation step and having a Webpack configuration file is enough to directly `import` the Styleguide immediately.

With ES2015 modules:

```js
import React from 'react';
import ColorPicker from 'socrata-components/components/ColorPicker';

const Component = React.createClass({
  render() {
    return <ColorPicker id="my-awesome-color-picker" />;
  }
});
```

For more information about integrating the Styleguide into a Webpack environment, check out the [socrata/frontend Webpack documentation](https://github.com/socrata/frontend/blob/master/doc/javascript.md#webpack).

### Styles

#### Inclusion through HTML
All of the bundled Styleguide assets are located in `dist`. To add them to your page, use a `<link>`.

```html
<!-- JavaScript component styles -->
<link href="node_modules/socrata-styleguide/dist/css/styleguide.min.css" rel="stylesheet">
```

#### Inclusion through Rails Sprockets
If you're using Rails Sprockets, you can include them in your asset configuration file and Sprockets directory files.
```ruby
# In config/initializers/assets.rb
Rails.application.config.assets.paths << Rails.root.join('node_modules')
```
```css
/**
 * In app/assets/stylesheets/application.css
 *= require socrata-components/dist/css/styleguide.min.css
 */
```

#### Individual styles
Styleguide styles are provided individually through `styles`.
For example, you can use the `_button.scss` styles directly:
```scss
@import "node_modules/socrata-components/styles/components/button";

.btn-modified-primary {
  @extend .btn-primary;
}
```
