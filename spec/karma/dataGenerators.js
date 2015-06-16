function generateBlockData(options) {

  var blockData = {
    id: 1,
    layout: '12',
    components: [
      {
        type: 'text',
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

function generateStoryData(options) {

  var storyData = {
    uid: 'test-test',
    title: 'Test Story',
    blocks: [ generateBlockData() ]
  };

  for (var prop in options) {
    if (options.hasOwnProperty(prop) && storyData.hasOwnProperty(prop)){ 
      storyData[prop] = options[prop];
    }
  }

  return storyData;
}
