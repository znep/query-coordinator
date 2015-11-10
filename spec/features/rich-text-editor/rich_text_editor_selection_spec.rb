require 'rails_helper'

RSpec.describe 'rich text editor selection', type: :feature, js: true do
  let(:uid) { 'h1bl-ocks' }

  def current_text_selection
    current_selection_script = File.read('spec/scripts/current-text-selection.js')
    evaluate_script(current_selection_script);
  end

  def link_toolbar_to_first_squire_instance
    link_toolbar_to_squire_instance(2)
  end

  before do
    stub_logged_in_user
    stub_core_view(uid)
    visit "/s/magic-thing/#{uid}/edit"
    @blocks = page.all('.user-story .block-edit')
    @rte_toolbar = page.find('#rich-text-editor-toolbar')
  end

  after :each do
    # Force the "are you sure you want to discard your unsaved changes"
    # modal to come up at a deterministic time. We can't do it in `before`,
    # as the modal comes up on page unload time. Thus any unrelated test that
    # happens to run after the last test in this file will fail (Selenium will
    # complain of an unhandled modal).
    unload_page_and_dismiss_confirmation_dialog
  end

  describe 'selecting text' do

    before do
      @heading_block = @blocks.first
      @squire_frame = @heading_block.find('iframe')
    end

    it 'maintains selection when click inside of the rich text toolbar' do
      initial_selection = nil

      link_toolbar_to_first_squire_instance

      within_frame(@squire_frame) do
        initial_selection = select_text_in_element('body > h1')
      end

      @rte_toolbar.find('.rich-text-editor-toolbar-btn-italic').click

      within_frame(@squire_frame) do
        expect(current_text_selection).to eq(initial_selection)
      end
    end

    it 'loses selection when clicking anywhere on the page that is not the rich text editor' do
      initial_selection = nil

      within_frame(@squire_frame) do
        initial_selection = select_text_in_element('body > h1')
      end

      find('.story-title').click

      within_frame(@squire_frame) do
        selection = current_text_selection

        expect(selection).to eq('')
      end
    end

  end
end
