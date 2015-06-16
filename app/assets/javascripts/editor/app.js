$(document).on('ready', function() {

  var textEditorManager = new TextEditorManager();

  var inspirationStory = new Story(inspirationStoryData);
  var inspirationStoryOptions = {
    story: inspirationStory,
    storyContainerElement: $('.inspiration-story'),
    scaleFactor: 0.5,
    editable: false,
    onRenderError: function() { $('.inspiration-story-error').removeClass('hidden'); }
  };
  var inspirationStoryRenderer = new StoryRenderer(inspirationStoryOptions);

  // Temporary fix until version is being added/populated
  if (userStoryData.version === null) {
    userStoryData.version = '';
  }

  // If we're loading an empty story for the first time, add example content
  if ((userStoryData.version === '') && (userStoryData.blocks.length === 0)) {
    userStoryData.blocks = sampleBlocks;
  }

  var userStory = new Story(userStoryData);
  var userStoryOptions = {
    story: userStory,
    storyContainerElement: $('.user-story'),
    editable: true,
    insertionHintElement: $('.user-story-insertion-hint'),
    textEditorManager: textEditorManager,
    onRenderError: function() {}
  };
  var userStoryRenderer = new StoryRenderer(userStoryOptions);

  inspirationStoryRenderer.render();
  userStoryRenderer.render();
});
