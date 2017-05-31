# DO NOT USE -- INACCURATE -- DEPRECATED

## CSS Modules and You!

"I want to write a fancy new react component... can I use CSS modules?"
#### YES!

Unfamiliar with CSS modules? Give the [react-css-modules](https://github.com/gajus/react-css-modules) readme a good close read!

It goes over the basics of CSS modules, why you should use them, and how to use them with react.
Also check out [this blog post](https://glenmaddern.com/articles/css-modules) for even more info if you need it.


This document will go over specifics of adding CSS modules to a react component you're adding to frontend.
Note that adding a component to the styleguide itself is much more straightforward than this since you most likely won't have to mess with the
webpack config. Much of the concepts remain the same, however.

### Config that Webpack!

You probably (definitely) want to use SCSS instead of CSS for these. You'll need to set up the Webpack Sass loader to find all the necessary files as well.

Here's an example webpack config that you'd see in frontend with the proper loaders set up...

`your-awesome-react-component.config.js`
```js
/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/YOUR_REACT_COMPONENT'),
  entry: './main.js',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/signin/.eslintrc.json'),
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      },
      {
        // this is the CSS module magic!
        test: /\.scss$/,
        loaders: [
          'style',
          // this long string is what will *actually* get generated as the classname for your components
          'css?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
          'sass'
        ]
      },
      {
        // this is needed to load our icons as SVG (more on that later!)
        test: /\.svg$/,
        loader: 'raw-loader',
        include: path.resolve('node_modules/socrata-components/dist/fonts/svg')
      },
      {
        // the rest of the fonts
        test: /\.(eot|woff|svg|woff2|ttf)$/,
        loader: 'url-loader?limit=100000',
        exclude: path.resolve('node_modules/socrata-components/dist/fonts/svg')
      }
    ]
  },
  // since the styleguide's scss gets compiled specifically for your component,
  // you also need all of its dependencies
  sassLoader: {
    includePaths: [
      'node_modules/bourbon/app/assets/stylesheets',
      'node_modules/bourbon-neat/app/assets/stylesheets',
      'node_modules/breakpoint-sass/stylesheets',
      'node_modules/modularscale-sass/stylesheets',
      'node_modules/normalize.css',
      'node_modules/socrata-components',
      'node_modules/socrata-components/styles',
      'node_modules/socrata-components/styles/variables',
      'node_modules/socrata-components/dist/fonts'
    ]
  },
  resolve: {
    alias: {
      // mostly for convenience later
      icons: path.resolve('node_modules/socrata-components/dist/fonts/svg')
    }
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
```

## Actually using css modules

I find that it's generally best practice to split up your scss files into one per directory, but you can technically have as many as you want (even one per js file if you're feelin' real crazy)

`YourAwesomeReactComponent/CoolPart/cool-part.scss`
```scss
/*
 * This is needed to tell the Sass loader where to find the fonts it needs...
 * For now, this needs to be at the top of every SCSS file where you import
 * the styleguide, but maybe we can find some better way in the future
*/
$default-font-path: "socrata-components/dist/fonts/";

/* This will give you access to *all* the classes from the styleguide! */
@import "styleguide-no-tag-level.scss";

/* Variables have to be specifically imported... */
@import "_colors.scss";

/*
 * Best part of CSS modules is you can name your classes whatever you want!
 * (except in this case, avoid using any class names
 * that the styleguide uses already... heh)
 *
 * This .button class will only have an effect in your component where
 * you specifically set it, rather than being applied to anything and
 * everything that has a .button class
 */
.button {
  /*
    These extends are the class names from the styleguide
    For some awesome advice on SCSS class composition,
    see the "Class Composition" section of the react-css-modules readme
    https://github.com/gajus/react-css-modules#class-composition

    Using CSS modules requires a bit of different thinking that
    what you may be used to; rather than doing i.e.

    .box {
      background-color: grey;

      &.rounded {
        border-radius: 25%;
      }
    }

    You'd do...

    .box {
      background-color: grey;
    }

    .box-rounded {
      @extend .box;

      border-radius: 25%;
    }
  */
  @extend .btn;
  @extend .btn-default;

  width: 75%;
  min-height: 50px;
  margin-top: 10px;
  margin-right: auto;
  margin-left: auto;
}

/*
 * I'll cover using SVG icons here as well...
 * You at least need something that sets the width and height of the icon,
 * because they come in quite huge
 */
.icon-container {
  width: 20px;
  height: 20px;

  & svg {
    width: 20px;
    height: 20px;

    /*
     * Note that not all icons are paths, so it's a good idea to open up the .svg file
     * and see what's inside of it. The way the SVG icons work, it will *literally*
     * just put what's in the .svg file into the page as HTML
     */
    & path {
      fill: $light-grey-1;
    }
  }
}
```


`YourAwesomeReactComponent/CoolPart/CoolPart.js`
```js
import React from 'react';
import cssModules from 'react-css-modules';

// your scss file!
import styles from './cool-part.scss';

// "icons" path here was set in the webpack config
import emailIcon from 'icons/email.svg';

class CoolPart extends React.Component {
  render() {
    return (
      /*
       * "styleName" here corresponds to the class name from the imported stylesheet
       *
       * Note that you can only have ONE styleName for your component!
       * (see "Class Composition" mentioned above; technially you can
       * configure react-css-modules to allow multiple styleNames,
       * but if you're doing that you're probably going about things all wrong)
       *
       * You can still set className here as well if you want a class you can query
       * the DOM for later or something, but className isn't needed for styles at all
       */
      <div>
        <div styleName="icon-container" dangerouslySetInnerHTML={{ __html: emailIcon }} />
        <button styleName="button" className="cool-part-button">Cool button!</button>
      </div>
    );
  }
}

export default cssModules(CoolPart, styles);

// if you're using react-redux, instead you would do
// export default connect(mapStateToProps)(cssModules(CoolPart, styles));
```
