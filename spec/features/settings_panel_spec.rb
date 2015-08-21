require 'rails_helper'

RSpec.describe 'settings panel', type: :feature, js: true do
  let(:data_toggle_selector) { '[data-panel-toggle="settings-panel"]' }
  let(:settings_panel_selector) { '.settings-panel' }
  let(:settings_overlay_selector) { '#settings-panel-overlay' }

  before do
    stub_logged_in_user
    stub_core_view('hasb-lock')
    visit '/s/magic-thing/hasb-lock/edit'
  end

  it 'opens and closes on click' do
    first_toggle = page.all(data_toggle_selector).first()
    # Expect initial state
    expect_settings_panel_to_be_closed
    expect(page.find('header')).to have_selector(data_toggle_selector, count: 2)

    # Open the panel
    first_toggle.click()

    # Expect opened state
    expect(page).to have_selector(data_toggle_selector, count: 4)
    expect_settings_panel_to_be_open

    # Close with overlay
    page.find("#{settings_overlay_selector}.active").click()
    expect_settings_panel_to_be_closed

    # Open again
    first_toggle.click()

    # Close with close button
    page.find("#{settings_panel_selector} .close-side-panel-btn").click()
    expect_settings_panel_to_be_closed

    first_toggle.click()

    # Close with the esc key
    page.find('body').native.send_keys(:escape)
    expect_settings_panel_to_be_closed
  end

  describe 'title' do
    before do
      toggle_pane
    end

    it 'loads the current title into the input box' do
      expect(page).to have_field('title', with: 'test story')
    end

    describe 'edit' do

      it 'enables the save button when the title is changed' do
        expect(page).to have_selector('.settings-panel .settings-save-btn:disabled')
        fill_in('title', with: 'editing!')
        expect(page).to have_selector('.settings-panel .settings-save-btn:enabled')
        fill_in('title', with: 'test story')
        expect(page).to have_selector('.settings-panel .settings-save-btn:disabled')
      end
    end
  end

  def expect_settings_panel_to_be_closed
    expect(page).to have_selector(settings_panel_selector, visible: false)
    expect(page).to have_selector(settings_overlay_selector, visible: false)
  end

  def expect_settings_panel_to_be_open
    expect(page).to have_selector(settings_panel_selector, visible: true)
    expect(page).to have_selector(settings_overlay_selector, visible: true)
  end

  def toggle_pane
    first_toggle = page.all(data_toggle_selector).first()
    first_toggle.click()
  end
end
