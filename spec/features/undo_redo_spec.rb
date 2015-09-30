require 'rails_helper'

# This test verifies the integration of HistoryStore with the rest of the system.
# This integration has proven problematic, because the system needs to understand
# the difference between direct user edits and i.e. Squire cleaning up the HTML
# automatically.
#
# This test verifies that:
# * The buttons enable/disable when expected.
# * Adding a text block counts as one atomic edit.
# * Undoing does not trigger a new edit (i.e., undo then redo works).
# * Block IDs are preserved across undo/redo.
# * Basic verification that undo/redo sets the correct block content
#   (though this is done through JS calls to StoryStore, not DOM verification).
RSpec.describe 'undo/redo', type: :feature, js: true do

  let(:data_toggle_selector) { 'button[data-panel-toggle="add-content-panel"]' }

  before do
    stub_logged_in_user
    stub_core_view('hasb-lock')
    visit '/s/magic-thing/hasb-lock/edit'
    @undo_btn = page.find('.undo-btn')
    @redo_btn = page.find('.redo-btn')
  end

  after :each do
    # Force the "are you sure you want to discard your unsaved changes"
    # modal to come up at a deterministic time. We can't do it in `before`,
    # as the modal comes up on page unload time. Thus any unrelated test that
    # happens to run after the last test in this file will fail (Selenium will
    # complain of an unhandled modal).
    unload_page_and_dismiss_confirmation_dialog
  end

  it 'should enable/disable the controls correctly' do
    def expect_button_disabled(button)
      expect(button[:disabled]).to eq('true')
    end

    def expect_button_enabled(button)
      # Nil because the attr is unset by the JS (vs. being set to 'false').
      expect(button[:disabled]).to be_nil
    end

    # Get number of blocks in the current story
    def block_count
      page.evaluate_script(
        'storyteller.storyStore.getStoryBlockIds(storyteller.userStoryUid).length'
      )
    end

    def block_content(block_id)
      # Ideally we'd dive into the iframe etc
      page.evaluate_script(
        "storyteller.storyStore.getBlockComponentAtIndex('#{block_id}', 0).value"
      )
    end

    initial_block_count = block_count

    expect_button_disabled(@undo_btn)
    expect_button_disabled(@redo_btn)

    expect(page.all('.user-story .block-edit').length).to eq(4)

    # Open the panel
    page.all(data_toggle_selector).first().click

    # Add a block.
    # Capybara complains that it can't scroll the sample block into screen.
    # Sigh. Do it with JS.
    page.evaluate_script('$(".inspiration-block").eq(0).dblclick()');
    expect(block_count).to eq(initial_block_count + 1)

    # Grab some details from the block.
    first_block_id = page.evaluate_script('$(".user-story .block").attr("data-block-id")')
    first_block_content = block_content(first_block_id)

    # Undo should enable.
    expect_button_enabled(@undo_btn)
    expect_button_disabled(@redo_btn)

    # Add another block.
    page.evaluate_script('$(".inspiration-block").eq(1).dblclick()');
    expect(block_count).to eq(initial_block_count + 2)

    # Grab block details.
    second_block_id = page.evaluate_script('$(".user-story .block").eq(1).attr("data-block-id")')
    second_block_content = block_content(second_block_id)
    expect(second_block_id).to_not eq(first_block_id);
    expect(second_block_content).to_not eq(first_block_content); # Test sanity

    # Nothing should change with the buttons.
    expect_button_enabled(@undo_btn)
    expect_button_disabled(@redo_btn)

    # Hit undo
    @undo_btn.click
    expect(block_count).to eq(initial_block_count + 1)
    expect(block_content(first_block_id)).to eq(first_block_content)

    # Both buttons should be enabled.
    expect_button_enabled(@undo_btn)
    # If the next line fails, ensure nothing is causing HistoryStore
    # to believe the user has made an edit (especially Squire).
    expect_button_enabled(@redo_btn)

    # Hit redo
    @redo_btn.click
    expect(block_count).to eq(initial_block_count + 2)
    expect(block_content(first_block_id)).to eq(first_block_content)
    expect(block_content(second_block_id)).to eq(second_block_content)
    expect_button_enabled(@undo_btn)
    expect_button_disabled(@redo_btn)

    # Undo all the way to the beginning.
    @undo_btn.click
    expect(block_count).to eq(initial_block_count + 1)
    expect(block_content(first_block_id)).to eq(first_block_content)
    expect_button_enabled(@undo_btn)
    expect_button_enabled(@redo_btn)
    @undo_btn.click
    expect(block_count).to eq(initial_block_count)
    expect_button_disabled(@undo_btn)
    expect_button_enabled(@redo_btn)
  end
end
