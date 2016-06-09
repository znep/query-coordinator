import _ from 'lodash';

export default {
  generateBlockData: function(options) {

    var blockData = {
      layout: '12',
      components: [
        {
          type: 'html',
          value: 'Hello, world!'
        }
      ],
      presentable: true
    };

    for (var prop in options) {
      if (options.hasOwnProperty(prop) && blockData.hasOwnProperty(prop)) {
        blockData[prop] = options[prop];
      }
    }

    return blockData;
  },
  generateStoryData: function(storyData) {

    var defaults = {
      uid: 'test-test',
      title: 'Test Story',
      description: 'Test Story Description',
      blocks: [ this.generateBlockData() ],
      publishedStory: {},
      digest: 'digest',
      permissions: {isPublic: false},
      theme: 'classic'
    };

    storyData = _.extend({}, defaults, storyData);

    return storyData;
  }
};
