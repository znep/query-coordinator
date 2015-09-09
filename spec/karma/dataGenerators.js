function generateBlockData(options) {

  var blockData = {
    id: '1',
    layout: '12',
    components: [
      {
        type: 'html',
        value: 'Hello, world!'
      }
    ]
  };

  for (var prop in options) {
    if (options.hasOwnProperty(prop) && blockData.hasOwnProperty(prop)){
      blockData[prop] = options[prop];
    }
  }

  return blockData;
}

function generateStoryData(storyData) {

  var defaults = {
    uid: 'test-test',
    title: 'Test Story',
    description: 'Test Story Description',
    blocks: [ generateBlockData() ],
    publishedStory: {},
    digest: 'digest',
    permissions: {isPublic: false},
    theme: 'classic'
  };

  storyData = _.extend({}, defaults, storyData);

  return storyData;
}
