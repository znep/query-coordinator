require 'rails_helper'

RSpec.describe 'add content panel', type: :feature, js: true do

  let(:resize_handle_selector) { '.component-resize-handle' }
  let(:component_selector) { '.component' }

  before do
    stub_logged_in_user
    stub_core_view('embd-html')
    visit '/s/magic-thing/embd-html/edit?autosave=false'
  end

  after :each do
    # Force the "are you sure you want to discard your unsaved changes"
    # modal to come up at a deterministic time. We can't do it in `before`,
    # as the modal comes up on page unload time. Thus any unrelated test that
    # happens to run after the last test in this file will fail (Selenium will
    # complain of an unhandled modal).
    unload_page_and_dismiss_confirmation_dialog
  end

  context 'on resize handle drag' do
    it 'updates the correct component layout.height' do
      def height_from_store()
        block_component_at_index(0)[:components][0]['value']['layout']['height']
      end

      component = page.find(component_selector)
      handle = page.find(resize_handle_selector)

      # handle.native.size.height isn't quite right, we'd need to account for
      # that + css top and bottom properties
      handle_height = 17

      original_height_in_value = height_from_store
      original_height_according_to_browser = component.native.size.height
      embiggen_by = 200

      page.driver.browser.action.
        click_and_hold(handle.native).
        move_by(0, embiggen_by).
        release.
        perform

      expect(height_from_store).to eq(original_height_in_value + embiggen_by - handle_height)
      expect(component.native.size.height).to eq(original_height_according_to_browser + embiggen_by)
    end
  end
end
