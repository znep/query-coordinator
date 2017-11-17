require 'rails_helper'

RSpec.describe 'rich text editor content', type: :feature, js: true do
  let(:uid) { 'h1bl-ocks' }

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view(uid)
    stub_current_domain

    set_feature_flags('enable_getty_images_gallery' => true)

    visit "/s/magic-thing/#{uid}/edit"

    @blocks = page.all('.user-story .block-edit')
    @rte_toolbar = page.find('#rich-text-editor-toolbar')
    @change_format_select = @rte_toolbar.find('[data-editor-action=change-format]')
  end

  after :each do
    # Force the "are you sure you want to discard your unsaved changes"
    # modal to come up at a deterministic time. We can't do it in `before`,
    # as the modal comes up on page unload time. Thus any unrelated test that
    # happens to run after the last test in this file will fail (Selenium will
    # complain of an unhandled modal).
    unload_page_and_dismiss_confirmation_dialog
  end

  describe 'change block type' do

    before do
      @heading_block = @blocks.first
      @squire_frame = @heading_block.find('iframe')
    end

    it 'removes extra div added by squire' do
      within_frame(@squire_frame) do
        expect(all('h1').length).to eq(1)
        expect(all('div').length).to eq(0)

        find('h1').set('New Title')

        expect(all('div').length).to eq(0)
      end
    end
  end

  describe 'clear formatting' do

    before do
      @heading_block = @blocks.first
      @squire_frame = @heading_block.find('iframe')
    end

    it 'clears the formatting of the selection' do
      within_frame(@squire_frame) do
        expect(all('h1').length).to eq(1)
        selection = select_text_in_element('body > h1')
      end

      editor_id = find('.component-html')['data-editor-id']
      # Simulate a focus event on the iframe, since Capybara's `.click` method
      # does not seem to trigger it, and the editor toolbar is only linked to
      # the editor when a focus event happens.
      trigger_focus_event = "$('iframe')[0].dispatchEvent(" \
        "new storyteller.CustomEvent(" \
          "'rich-text-editor::focus-change'," \
          "{ detail: { id: #{editor_id}, isFocused: true }, bubbles: true }" \
        ")" \
      ");"

      page.execute_script(trigger_focus_event)

      find('.rich-text-editor-toolbar-btn-clearFormatting').click

      within_frame(@squire_frame) do
        expect(all('h1').length).to eq(0)
      end
    end
  end
end
