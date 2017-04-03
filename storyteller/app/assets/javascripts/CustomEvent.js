import StorytellerUtils from './StorytellerUtils';

StorytellerUtils.export(CustomEvent, 'storyteller.CustomEvent');

export default function CustomEvent(event, params) {
  params = params || { bubbles: false, cancelable: false, detail: undefined };
  var evt = document.createEvent( 'CustomEvent' );
  evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
  return evt;
}

CustomEvent.prototype = window.Event.prototype;
