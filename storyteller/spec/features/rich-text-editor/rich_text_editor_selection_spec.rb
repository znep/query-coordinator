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
    stub_current_domain
    stub_approvals_settings

    set_feature_flags('enable_getty_images_gallery' => true, 'use_fontana_approvals' => true)

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
      link_toolbar_to_first_squire_instance
      @text_color_button = @rte_toolbar.find('.rich-text-editor-toolbar-btn-textColor')
    end

    it 'changes to a default color when clicked or a custom color when a custom color is entered or clicked' do
      initial_selection = nil
      initial_h1_color = nil
      current_h1_color = nil
      debb1e_hex = '#debb1e'
      debb1e_rgba = 'rgba(222, 187, 30, 1)'

      within_frame(@squire_frame) do
        initial_selection = select_text_in_element('body > h1')
        initial_h1_color = page.find('h1').native.css_value('color')
      end

      # First create a new custom color
      @text_color_button.click
      custom_color_input = @rte_toolbar.find('.rich-text-editor-toolbar-text-color-panel-color-input')
      custom_color_input.set(debb1e_hex)
      @rte_toolbar.find('.rich-text-editor-toolbar-text-color-panel-active-custom-color-swatch').click

      # Verify that the new custom color was applied
      within_frame(@squire_frame) do
        current_h1_color = page.find('h1 .colour').native.css_value('color')

        expect(current_text_selection).to eq(initial_selection)
        expect(current_h1_color).to_not eq(initial_h1_color)
        expect(current_h1_color).to eq(debb1e_rgba)
      end

      # Next set the color back to a default color
      @text_color_button.click
      default_swatches = @rte_toolbar.all('.rich-text-editor-toolbar-text-color-panel-color-swatch')
      swatch = default_swatches[2]
      swatch_background_color = swatch.native.css_value('background-color')
      swatch.click

      # Verify that the default color was applied
      within_frame(@squire_frame) do
        current_h1_color = page.find('h1 .colour').native.css_value('color')

        expect(current_text_selection).to eq(initial_selection)
        expect(current_h1_color).to_not eq(initial_h1_color)
        expect(current_h1_color).to eq(swatch_background_color)
      end

      # Finally set the color to the saved custom color
      @text_color_button.click
      custom_swatches = @rte_toolbar.all('.rich-text-editor-toolbar-text-color-panel-custom-color-swatch')
      swatch = custom_swatches[0]
      swatch_background_color = swatch.native.css_value('background-color')

      # Verify that the custom color swatch is the same as the custom color we created
      expect(swatch_background_color).to eq(debb1e_rgba)

      swatch.click

      # Verify that the saved custom color was applied
      within_frame(@squire_frame) do
        current_h1_color = page.find('h1 .colour').native.css_value('color')

        expect(current_text_selection).to eq(initial_selection)
        expect(current_h1_color).to_not eq(initial_h1_color)
        expect(current_h1_color).to eq(debb1e_rgba)
      end
    end
    it 'updates the default colors when the story theme is changed' do
      @text_color_button.click

      default_swatches = @rte_toolbar.
        find('.rich-text-editor-toolbar-text-color-panel').
        all('.rich-text-editor-toolbar-text-color-panel-color-swatch')

      original_bgcolors = swatch_bgcolors(default_swatches)

      # Switch to a new theme
      page.find('[data-panel-toggle="style-and-presentation-panel"]').click
      # Wait for existing animations. If you can come up with a good
      # reliable selector for this, be my guest :)
      sleep 0.5
      another_theme_button = page.all('.theme-list .theme:not(.active)').first
      another_theme_button.click

      @text_color_button.click

      new_bgcolors = nil

      wait_until do
        new_bgcolors = swatch_bgcolors(default_swatches)
        new_bgcolors != original_bgcolors
      end

      # first 2 colors should change
      expect(new_bgcolors.first(2)).to_not eq(original_bgcolors.first(2))

      # remaining colors should stay the same
      expect(new_bgcolors.drop(2)).to eq(original_bgcolors.drop(2))
    end
  end

  private

  def swatch_bgcolors(swatches)
    swatches.map { |swatch| swatch.native.css_value('background-color') }
  end

end
