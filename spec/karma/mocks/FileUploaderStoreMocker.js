import FileUploaderStore, {__RewireAPI__ as FileUploaderStoreAPI} from '../../../app/assets/javascripts/editor/stores/FileUploaderStore';

export default {
  create: function(options) {
    var rewires = _.get(options, 'rewires', {});
    var properties = _.get(options, 'properties', {});

    this.rewire(rewires);

    return new FileUploaderStoreMocker(properties);
  },
  rewire: function(rewires) {
    _.each(rewires, function(rewire, key) {
      FileUploaderStoreAPI.__Rewire__(key, rewire);
    });
  }
};

function FileUploaderStoreMocker(properties) {
  _.extend(this, new FileUploaderStore(), properties);
}
