# Component Demos!

This folder holds the demo pages for common components. All common components should have a corresponding demo page here. Demos are a good line of defense against regressions, and are an excellent form of documentation.

Demos are accessible on any Socrata domain. For example, https://opendata.test-socrata.com/internal/demos/components/button

## Characteristics of a good demo:

Often, the very existence of a demo is immensely useful as a known-good starting point. However, some
attributes multiply their utility. A good demo is:

  1. Ready out-of-the-box. Demos are meant for easy consumption. As much as possible, a good demo page does
     not depend on any setup or local data. If API calls must be made, point these to a stable domain and
     dataset (for instance,
     [Chicago Crimes](https://data.cityofchicago.org/Public-Safety/Crimes-2001-to-present/ijzp-q8t)).
  2. Comprehensive. All valid states can be demonstrated from within the demo page. Remember, demos are not
     just for developers.
  3. Self-documenting. A demo should explain what the purpose of its component is.
  4. Developer-friendly. Give idiomatic code samples, ideally in-sync with what is being displayed on-screen.
     For instance, note the live JSX sample on the
     [button demo](https://opendata.test-socrata.com/internal/demos/components/button). Preserve relevant
     state on refresh (i.e., with Local Storage) to facilitate development. A good demo page is a good
     test harness.
  5. Fit for purpose. If a demo isn't working out for your needs, spend the time to improve it. Demos are for
     you. For instance, we recently made the
     [Authoring Experience demo](https://opendata.test-socrata.com/internal/demos/visualizations/authoring_workflow)
     preserve the last configured visualization on page refresh. This makes it super-easy to quickly iterate
     on visualizations.


## Adding a demo

The simpler adding a demo is, the more high-quality demos we'll be able to take advantage of. Please help
improve the process.

To add a demo:

1. Make note of the directory structure. By and large, demos are standard Rails pages with a controller,
   view (ERB), styles, and JS.
  * Views live under /frontend/app/views/demos
  * JS lives under /frontend/public/javascripts/demos, and are pulled in via a standard entry in
    /frontend/config/webpack/shared.config.js.
  * Styles live under /frontend/app/styles/demos
2. Decide if you can adapt an existing demo page or need to add a brand-new page.
3. If adding a new demo:
  1. Choose a category for your demo. Most demos will fall under `components/`, but `visualizations/` and
     `elements/` are available too. These instructions assume you're making a `components/` demo, but simply
     place your demo under the folder appropriate to your demo.
  2. Add an ERB under `/frontend/app/views/demos/components/YOURDEMO.html.erb`. A good starting point is the
     [button demo](https://github.com/socrata/platform-ui/blob/master/frontend/app/views/demos/components/button.html.erb).
     At a bare minimum, you should include the minimal demo environment:
     ```erb
     <% content_for :head do %>
       <title>Example Usage: PLACEHOLDER</title>
       <meta http-equiv="content-type" content="text/html; charset=UTF8">
       <%= rendered_stylesheet_tag 'component_example_pages' %>
     <% end %>

     <section class="styleguide-section">
       <p>
         <a class="btn btn-default" href='/internal/demos/components'>
           <span class="socrata-icon-arrow-left"></span>
           Components
         </a>
       </p>
       <h2 class="styleguide-header">PLACEHOLDER</h2>
       <div id="component-demo" />
     </section>
     <% content_for :scripts do %>
       <%= render_demos_javascript_environment %>
       <%= include_webpack_bundle 'shared/componentExamplePagesMain' %>
       <!-- Include other webpack bundles as needed -->
     <% end %>
     ```

     *Adding this ERB will automatically populate a link from the top-level demo page and add the
     assiciated route.*

  3. Add and include relevant styles in `/frontend/app/styles/demos`. Note that you might not need to add any
     styles since styleguide is already included by default in demo pages.
  4. Add javascript to render your component under `/frontend/public/javascripts/demos/components`. Pull your
     code into the page by adding an entry under `/frontend/config/webpack/shared.config.js`. For example,
     see the entry for `componentExamplePagesButton`. Additionally, see the `Suggested Architecture` section
     below.


### Suggested architecture

Since JSX is not supported in ERBs, the recommendation is to code the demo as a mini-SPA, almost entirely in
JS. For instance, have a look at how the `Button` demo works.

1. The
   [erb](https://github.com/socrata/platform-ui/blob/master/frontend/app/views/demos/components/button.html.erb)
   does very little other than adding a `<div id="component-demo" />`.
2. The
   [JS code](https://github.com/socrata/platform-ui/blob/master/frontend/public/javascripts/demos/components/button.js)
   defines a `ButtonDemo` React component:
   ```jsx
    import { Button } from 'common/components';

    class ButtonDemo extends Component {
      render() {
        const buttonProps = { variant: 'simple' };
        return (<div>
          <Button {...buttonProps} />
          {this.showJsxSample(buttonProps)}
        </div>);
      }

      // etc
    }
    ```

    This demo component is then put into the `<div>` created by the `erb`:
    ```js
    $(() => {
      ReactDOM.render(
        React.createElement(ButtonDemo),
        document.getElementById('component-demo')
      );
    });
    ```
