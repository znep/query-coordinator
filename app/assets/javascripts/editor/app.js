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
