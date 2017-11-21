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
    stub_sufficient_rights
    stub_core_view('hasb-lock')
    stub_current_domain

    set_feature_flags('enable_getty_images_gallery' => true)

    visit '/s/magic-thing/hasb-lock/edit'

    @original_story_json = current_story_json
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

  # EN-18849 - Disabling this test for now since it is extremely flaky
  xit 'should enable/disable the controls correctly' do
    def expect_button_disabled(button)
      expect(button[:disabled]).to eq('true')
    end

    def expect_button_enabled(button)
      # Nil because the attr is unset by the JS (vs. being set to 'false').
      expect(button[:disabled]).to be_nil
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
    first_block_content = block_content_at_index(first_block_id, 0)

    # Undo should enable.
    expect_button_enabled(@undo_btn)
    expect_button_disabled(@redo_btn)

    # Add another block.
    page.evaluate_script('$(".inspiration-block").eq(1).dblclick()');
    expect(block_count).to eq(initial_block_count + 2)

    # Grab block details.
    second_block_id = page.evaluate_script('$(".user-story .block").eq(1).attr("data-block-id")')
    second_block_content = block_content_at_index(second_block_id, 0)
    expect(second_block_id).to_not eq(first_block_id);
    expect(second_block_content).to_not eq(first_block_content); # Test sanity

    # Nothing should change with the buttons.
    expect_button_enabled(@undo_btn)
    expect_button_disabled(@redo_btn)

    # Hit undo
    @undo_btn.click
    expect(block_count).to eq(initial_block_count + 1)
    expect(block_content_at_index(first_block_id, 0)).to eq(first_block_content)

    # Both buttons should be enabled.
    expect_button_enabled(@undo_btn)
    # If the next line fails, ensure nothing is causing HistoryStore
    # to believe the user has made an edit (especially Squire).
    expect_button_enabled(@redo_btn)

    # Hit redo
    @redo_btn.click
    expect(block_count).to eq(initial_block_count + 2)
    expect(block_content_at_index(first_block_id, 0)).to eq(first_block_content)
    expect(block_content_at_index(second_block_id, 0)).to eq(second_block_content)
    expect_button_enabled(@undo_btn)
    expect_button_disabled(@redo_btn)

    # Undo all the way to the beginning.
    @undo_btn.click
    expect(block_count).to eq(initial_block_count + 1)
    expect(block_content_at_index(first_block_id, 0)).to eq(first_block_content)
    expect_button_enabled(@undo_btn)
    expect_button_enabled(@redo_btn)
    @undo_btn.click
    expect(block_count).to eq(initial_block_count)
    expect_button_disabled(@undo_btn)
    expect_button_enabled(@redo_btn)
  end

  describe 'rich text editor' do

    before do
      @blocks = page.all('.user-story .block-edit')
      @heading_block = @blocks.first
      @squire_frame = @heading_block.find('iframe')
    end

    context 'when user types a single letter' do
      it 'undoes and redoes' do
        type_key_into_squire(@squire_frame, 's')
        undo_then_verify_story_returns_to_original_content
      end
    end

    context 'when pasting from another block' do
      it 'undoes and redoes' do
        # Select all contents in the second block. Couldn't get ctrl-a (select all) to work.
        # So bruteforce selection with normal DOM APIs.
        other_iframe_index = 2
        page.evaluate_multiline_script("
          var iframeWindow = $('iframe').eq(#{other_iframe_index})[0].contentWindow;
          var selection = iframeWindow.getSelection();
          selection.removeAllRanges();
          selection.selectAllChildren(iframeWindow.document.body);
        ")

        copy_current_selection(page.all('iframe')[other_iframe_index])
        paste_clipboard_into_squire(@squire_frame)

        undo_then_verify_story_returns_to_original_content
      end
    end

    context 'when pasting complex things' do
      # The intent of this test is to verify that Squire's fixing-up of complex
      # clipboard contents does not count as a user action. If there is a regression
      # in this area, the Squire fixups will blow away the redo stack which will
      # break this test.
      it 'can redo after multiple edits and redos' do
        copy_html_to_clipboard('<section><div><p><b>complex</b><i>things</i><p></div></section>')
        paste_clipboard_into_squire(@squire_frame)
        story_after_paste_json = current_story_json

        type_key_into_squire(@squire_frame, 's')
        story_after_key_press_json = current_story_json

        expect(story_after_paste_json).to_not eq(@original_story_json)
        expect(story_after_key_press_json).to_not eq(story_after_paste_json)

        @undo_btn.click
        expect(current_story_json).to eq(story_after_paste_json)
        @undo_btn.click
        expect(current_story_json).to eq(@original_story_json)

        @redo_btn.click
        expect(current_story_json).to eq(story_after_paste_json)
        @redo_btn.click
        expect(current_story_json).to eq(story_after_key_press_json)
      end
    end

    def undo_then_verify_story_returns_to_original_content
      dirty_story_json = current_story_json
      expect(dirty_story_json).to_not eq(@original_story_json)

      @undo_btn.click
      expect(current_story_json).to eq(@original_story_json)

      @redo_btn.click
      expect(current_story_json).to eq(dirty_story_json)
    end
  end

  def copy_html_to_clipboard(html)
    page.evaluate_multiline_script("
      var $clipboardContentSource = $('<div id=\"clipboard-content-source\"></div>');
      $clipboardContentSource.append('#{html}');
      $(document.body).append($clipboardContentSource);
      window.getSelection().removeAllRanges();
      window.getSelection().selectAllChildren($clipboardContentSource[0]);
    ")
    copy_current_selection
    page.evaluate_script('$("#clipboard-content-source").remove()')
  end

  def type_key_into_squire(squire_frame, key)
    with_squire_body_element(squire_frame) do |squire_body|
      squire_body.native.send_key(key)
    end
  end

  def paste_clipboard_into_squire(squire_frame)
    with_squire_body_element(squire_frame) do |squire_body|
      squire_body.native.send_keys([os_control_key, 'v'])
    end
  end

  # Copy the current selection from the page (by default)
  # or from the given iframe's selection (if an iframe is passed
  # as an argument).
  def copy_current_selection(source_element=page.find('body'))
    source_element.native.send_keys([os_control_key, 'c'])
  end

  def with_squire_body_element(iframe)
    within_frame(iframe) do
      yield(find('body'))
    end
  end
end
