require 'rails_helper'

RSpec.describe 'style and presentation panel', type: :feature, js: true do
  let(:data_toggle_selector) { 'button[data-panel-toggle="style-and-presentation-panel"]' }
  let(:style_and_presentation_panel_selector) { '#style-and-presentation-panel' }
  let(:user_story_container_selector) { '.user-story-container' }

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('hasb-lock')
    stub_current_domain
    stub_approvals_settings

    set_feature_flags('enable_getty_images_gallery' => true, 'use_fontana_approvals' => true)

    visit '/s/magic-thing/hasb-lock/edit'

    @blocks = page.all('.user-story .block-edit')
    @first_block = @blocks.first
  end

  it 'opens and closes on click' do
    style_and_presentation_button = page.all(data_toggle_selector).first()
    # Expect initial state
    expect_style_and_presentation_panel_to_be_closed
    expect(page.find('header')).to have_selector(data_toggle_selector, count: 1)

    # Open the panel
    style_and_presentation_button.click()

    # Expect opened state
    expect(page.find("#{style_and_presentation_panel_selector}")).to have_selector(data_toggle_selector, count: 1)
    expect_style_and_presentation_panel_to_be_open

    # Close with close button
    sleep(0.2.second)
    page.find("#{style_and_presentation_panel_selector} #{data_toggle_selector}").click()
    expect_style_and_presentation_panel_to_be_closed

    # Open the panel
    style_and_presentation_button.click()

    # Close with the esc key
    page.find('body').native.send_keys(:escape)
    expect_style_and_presentation_panel_to_be_closed

    # Open the panel
    style_and_presentation_button.click()

    # Close with add content button
    style_and_presentation_button.click()
    expect_style_and_presentation_panel_to_be_closed
  end

  describe 'click outside the style and presentation panel' do
    it 'closes the add style and presentation panel when clicking within a block' do
      @first_block.click()
      expect_style_and_presentation_panel_to_be_closed
    end

    it 'closes the style and presentation panel when clicking within the story (outside a block)' do
      user_story_container = page.all(user_story_container_selector).first()
      user_story_container.click()
      expect_style_and_presentation_panel_to_be_closed
    end
  end

  def expect_style_and_presentation_panel_to_be_closed
    expect(page).to have_selector(style_and_presentation_panel_selector, visible: false)
  end

  def expect_style_and_presentation_panel_to_be_open
    expect(page).to have_selector(style_and_presentation_panel_selector, visible: true)
  end
end
