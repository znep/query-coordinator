import Flux from 'flux';
import StorytellerUtils from '../StorytellerUtils';

export var dispatcher = StorytellerUtils.export(new Flux.Dispatcher(), 'storyteller.dispatcher');
export default Flux.Dispatcher;
