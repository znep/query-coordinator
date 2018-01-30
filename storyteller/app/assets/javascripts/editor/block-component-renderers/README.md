# Adding Block Components
When adding new blocks or updating existing blocks, there are a number of files to touch and considerations for the data store of the component.

## JavaScript component
All of your component’s rendering should take place in the jQuery plugin for the component.

You should expect the plugin to get called multiple times during the life of the story page. As such, you should take care to only perform expensive operations when you need to, e.g. the configuration changed or the component can’t automatically handle resizing (your component should handle automatic resizing).

## Rails view partial
There’s a rails view partial that should be added and is a great place to document the expected format of the component data.

All rendering happens in the jQuery plugin so it’s not necessary to render any content from the view partial.

## DomainUpdater
If you store domain names in your component, you’ll need to add your component to the `DomainUpdater` service object to handle domain CNAME changes.

## Files needing changes
Here’s a list of files that need to be updated when adding a new component:
- `app/assets/javascripts/editor/block-component-renderers/index.js`
- `app/assets/javascripts/editor/renderers/StoryRenderer.js`
- `app/assets/javascripts/editor/stores/MoveComponentStore.js`
- `app/assets/javascripts/view/index.js`
- `app/assets/stylesheets/edit/components/media.scss`
- `app/helpers/stories_helper.rb`
- `app/services/domain_updater.rb`
- Tests
