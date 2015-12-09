require 'rails_helper'

RSpec.describe 'inspiration block list json', type: :feature, js: true do

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_valid_initialized_lenses_view
    visit '/s/magic-thing/hasb-lock/edit'
  end

  it 'should have renderable blocks' do
    #
    # ##### WARNING ######
    # This type of test is a very rare case. Do NOT follow this example unless
    # absolutely necessary.
    # #####################
    #
    # This is the only straightforward way to access both the inspiration block json,
    # and the ability to force render a story.
    #
    # This test will prevent people from adding poorly formed or un-renderable
    # inspiration block data. Please forgive the javascript in a ruby test.

    # Get all inspiration block data, and render the user story with it
    page.evaluate_multiline_script("
      var inspirationBlocks = $('[data-block-content]');
      var storyData = storyteller.storyStore.serializeStory(storyteller.userStoryUid);
      var inspirationBlockContent = [];

      $.each(inspirationBlocks, function(index, block) {
        var blockContent = JSON.parse(block.getAttribute('data-block-content'));

        var shouldTestComponent = true;

        blockContent.components.forEach(function(component) {
          if (component.type === 'socrataVisualization') {
            shouldTestComponent = false;
          }
        });

        if (shouldTestComponent) {
          inspirationBlockContent.push(blockContent);
        }
      });

      // Override existing user story with all inspiration blocks
      storyData.blocks = inspirationBlockContent;

      // Trigger a re-render
      storyteller.dispatcher.dispatch({
        action: Actions.STORY_OVERWRITE_STATE,
        data: storyData
      });"
    )
    # No need for assertions, as any javascript errors will cause the test to fail

    unload_page_and_dismiss_confirmation_dialog
  end

end
