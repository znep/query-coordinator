require 'rails_helper'

RSpec.describe 'inspiration block list json', type: :feature, js: true do

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_valid_initialized_lenses_view
    stub_current_domain
    stub_approvals_settings

    set_feature_flags('enable_getty_images_gallery' => true, 'use_fontana_approvals' => true)

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
      var storyData = storyteller.storyStore.serializeStory(window.STORY_UID);

      // Insert all inspiration blocks
      $.each(inspirationBlocks, function(index, block) {
        var blockContent = JSON.parse(block.getAttribute('data-block-content'));

        var shouldTestComponent = true;

        blockContent.components.forEach(function(component) {
          if (component.type === 'socrataVisualization') {
            shouldTestComponent = false;
          }
        });

        if (shouldTestComponent) {
         storyteller.dispatcher.dispatch({
           action: 'STORY_INSERT_BLOCK',
           storyUid: window.STORY_UID,
           insertAt: 0,
           blockContent: blockContent
         });
        }
      });
      "
    )
    # No need for assertions, as any javascript errors will cause the test to fail

    unload_page_and_dismiss_confirmation_dialog
  end

end
