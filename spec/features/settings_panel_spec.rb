require 'rails_helper'

RSpec.describe 'settings panel', type: :feature, js: true do
  data_toggle_selector      = '[data-panel-toggle="settings-panel"]'
  settings_panel_selector   = '.settings-panel'

  before do
    allow_any_instance_of(ApplicationController).to receive(:require_logged_in_user).and_return(true)
    visit '/s/magic-thing/hasb-lock/edit'
  end

  it 'opens and closes on click' do
    # Expect initial state
    expect(page.find('header')).to have_selector(data_toggle_selector, count: 2)
    expect(page).to have_selector(settings_panel_selector, visible: false)

    # Open the panel
    page.all(data_toggle_selector).first().click()

    # Expect opened state
    expect(page).to have_selector(settings_panel_selector, visible: true)
    expect(page).to have_selector(data_toggle_selector, count: 4)
    expect(page).to have_selector('.settings-panel-overlay', visible: true)

    # Close with overlay
    page.find('.settings-panel-overlay.active').click()
    expect(page).to have_selector(settings_panel_selector, visible: false)
    expect(page).to have_selector('.settings-panel-overlay', visible: false)

    # Open again
    page.all(data_toggle_selector).first().click()

    # Close with close button
    page.find('.settings-panel .close-side-panel-btn').click()
    expect(page).to have_selector(settings_panel_selector, visible: false)
    expect(page).to have_selector('.settings-panel-overlay', visible: false)
  end

end
