import StoryStore, {__RewireAPI__ as StoryStoreAPI} from '../../../app/assets/javascripts/editor/stores/StoryStore';

export default {
  create: function(options) {
    var rewires = _.get(options, 'rewires', {});
    var properties = _.get(options, 'properties', {});

    this.rewire(rewires);

    return new StoryStoreMocker(properties);
  },
  rewire: function(rewires) {
    _.each(rewires, function(rewire, key) {
      StoryStoreAPI.__Rewire__(key, rewire);
    });
  }
};

function StoryStoreMocker(properties) {
  _.extend(this, new StoryStore(), properties);
}
