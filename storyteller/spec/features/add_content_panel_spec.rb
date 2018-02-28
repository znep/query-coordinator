require 'rails_helper'

RSpec.describe 'add content panel', type: :feature, js: true do
  let(:data_toggle_selector) { 'button[data-panel-toggle="add-content-panel"]' }
  let(:add_content_panel_selector) { '#add-content-panel' }
  let(:user_story_container_selector) { '.user-story-container' }

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('hasb-lock')
    stub_current_domain
    stub_approvals_settings

    visit '/s/magic-thing/hasb-lock/edit'
    @blocks = page.all('.user-story .block-edit')
    @first_block = @blocks.first
  end

  it 'opens and closes on click' do
    add_content_button = page.all(data_toggle_selector).first()
    # Expect initial state
    expect_add_content_panel_to_be_closed
    expect(page.find('header')).to have_selector(data_toggle_selector, count: 1)

    # Open the panel
    add_content_button.click()

    # Expect opened state
    expect(page.find("#{add_content_panel_selector}")).to have_selector(data_toggle_selector, count: 1)
    expect_add_content_panel_to_be_open

    # Close with close button
    page.find("#{add_content_panel_selector} #{data_toggle_selector}").click()
    expect_add_content_panel_to_be_closed

    # Open the panel
    add_content_button.click()

    # Close with the esc key
    page.find('body').native.send_keys(:escape)
    expect_add_content_panel_to_be_closed

    # Open the panel
    add_content_button.click()

    # Close with add content button
    add_content_button.click()
    expect_add_content_panel_to_be_closed
  end

  describe 'click outside the add content panel' do
    it 'closes the add content panel when clicking within a block' do
      @first_block.click()
      expect_add_content_panel_to_be_closed
    end

    it 'does not close the add content panel when clicking within the story (outside a block)' do
      user_story_container = page.all(user_story_container_selector).first()
      user_story_container.click()
      expect_add_content_panel_to_be_open
    end
  end

  def expect_add_content_panel_to_be_closed
    expect(page).to have_selector(add_content_panel_selector, visible: false)
  end

  def expect_add_content_panel_to_be_open
    expect(page).to have_selector(add_content_panel_selector, visible: true)
  end
end
