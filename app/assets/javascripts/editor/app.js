$(document).on('ready', function() {

  var inspirationStory = new Story(inspirationStoryData);
  var userStory = new Story(userStoryData);
  var textEditorManager = new TextEditorManager();
  var renderer = new StoryRenderer(inspirationStory, userStory, textEditorManager);

  renderer.renderInspirationStory();
  renderer.renderUserStory();
});
