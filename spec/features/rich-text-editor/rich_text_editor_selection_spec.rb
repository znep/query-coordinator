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
    stub_sufficient_rights
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

  describe 'changing text colors' do

    before do
      @heading_block = @blocks.first
      @squire_frame = @heading_block.find('iframe')
    end

    it 'changes to a default color when clicked or a custom color when a custom color is entered or clicked' do
      initial_selection = nil
      initial_h1_color = nil
      current_h1_color = nil
      debb1e_hex = '#debb1e'
      debb1e_rgba = 'rgba(222, 187, 30, 1)'
      text_color_button = @rte_toolbar.find('.rich-text-editor-toolbar-btn-textColor')

      link_toolbar_to_first_squire_instance

      within_frame(@squire_frame) do
        initial_selection = select_text_in_element('body > h1')
        initial_h1_color = page.find('h1').native.css_value('color')
      end

      # First create a new custom color
      text_color_button.click
      custom_color_input = @rte_toolbar.find('.rich-text-editor-toolbar-text-color-panel-color-input')
      custom_color_input.set(debb1e_hex)
      @rte_toolbar.find('.rich-text-editor-toolbar-text-color-panel-active-custom-color-swatch').click

      # Verify that the new custom color was applied
      within_frame(@squire_frame) do
        current_h1_color = page.find('h1 > .colour').native.css_value('color')

        expect(current_text_selection).to eq(initial_selection)
        expect(current_h1_color).to_not eq(initial_h1_color)
        expect(current_h1_color).to eq(debb1e_rgba)
      end

      # Next set the color back to a default color
      text_color_button.click
      default_swatches = @rte_toolbar.all('.rich-text-editor-toolbar-text-color-panel-color-swatch')
      swatch = default_swatches[2]
      swatch_background_color = swatch.native.css_value('background-color')
      swatch.click

      # Verify that the default color was applied
      within_frame(@squire_frame) do
        current_h1_color = page.find('h1 > .colour').native.css_value('color')

        expect(current_text_selection).to eq(initial_selection)
        expect(current_h1_color).to_not eq(initial_h1_color)
        expect(current_h1_color).to eq(swatch_background_color)
      end

      # Finally set the color to the saved custom color
      text_color_button.click
      custom_swatches = @rte_toolbar.all('.rich-text-editor-toolbar-text-color-panel-custom-color-swatch')
      swatch = custom_swatches[0]
      swatch_background_color = swatch.native.css_value('background-color')

      # Verify that the custom color swatch is the same as the custom color we created
      expect(swatch_background_color).to eq(debb1e_rgba)

      swatch.click

      # Verify that the saved custom color was applied
      within_frame(@squire_frame) do
        current_h1_color = page.find('h1 > .colour').native.css_value('color')

        expect(current_text_selection).to eq(initial_selection)
        expect(current_h1_color).to_not eq(initial_h1_color)
        expect(current_h1_color).to eq(debb1e_rgba)
      end
    end

    it 'updates the default colors when the story theme is changed' do
      initial_selection = nil
      initial_h1_color = nil
      current_h1_color = nil
      text_color_button = @rte_toolbar.find('.rich-text-editor-toolbar-btn-textColor')
      text_color_swatches = nil

      link_toolbar_to_first_squire_instance

      text_color_button.click

      text_color_swatches = @rte_toolbar.all('.rich-text-editor-toolbar-text-color-panel-color-swatch')

      original_first_theme_default_color = text_color_swatches[3].native.css_value('background-color')
      original_second_theme_default_color = text_color_swatches[4].native.css_value('background-color')

      page.find('[data-panel-toggle="style-and-presentation-panel"]').click
      page.find('[data-theme="sans"]').click

      text_color_button.click

      new_first_theme_default_color = text_color_swatches[3].native.css_value('background-color')
      new_second_theme_default_color = text_color_swatches[4].native.css_value('background-color')

      expect(original_first_theme_default_color).to_not eq(new_first_theme_default_color)
      expect(original_second_theme_default_color).to_not eq(new_second_theme_default_color)
    end
  end
end
