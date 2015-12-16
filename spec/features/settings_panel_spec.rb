require 'rails_helper'

RSpec.describe 'settings panel', type: :feature, js: true do
  let(:data_toggle_selector) { '[data-panel-toggle="settings-panel"]' }
  let(:settings_panel_selector) { '.settings-panel' }
  let(:settings_overlay_selector) { '#settings-panel-overlay' }
  let(:settings_title_description) { '.settings-panel .menu-list-item:first-child .menu-list-item-header' }
  let(:settings_make_copy) { '.settings-panel .menu-list-item:nth-child(2) .menu-list-item-header' }

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('hasb-lock', {
      'rights' => ['update_view'],
      'owner' => {
        'id' => 'tugg-xxxx'
      }
    })
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

      title_description = page.all(settings_title_description).first()
      title_description.click()
    end

    it 'loads the current title into the input box' do
      expect(page).to have_field('title', with: 'test story')
    end

    describe 'edit' do

      it 'limits the field to 254 characters' do
        fill_in('title', with: string_with_1024_chars)

        expect(page.find('input[name="title"]').value).to eq(string_with_254_chars)
      end

      it 'enables the save button when the title is changed' do
        expect(page).to have_selector('.settings-panel .settings-save-btn:disabled')
        fill_in('title', with: 'editing!')
        expect(page).to have_selector('.settings-panel .settings-save-btn:enabled')
        fill_in('title', with: 'test story')
        expect(page).to have_selector('.settings-panel .settings-save-btn:disabled')
      end
    end
  end

  # We hide the settings panel when making a copy because the panel z-index is higher
  # than the modal z-index. This can be removed if fit-and-finish changes that.
  describe 'make a copy' do
    before do
      toggle_pane

      title_description = page.all(settings_make_copy).first()
      title_description.click()
    end

    it 'closes settings panel and shows the modal' do
      expect(page).to have_selector('#make-a-copy-container', visible: true)
    end

    context 'when you close the modal' do
      before do
        page.find('#make-a-copy-container .make-a-copy-button-group button.back-btn').click
      end

      it 'opens settings panel and hides the modal' do
        expect_settings_panel_to_be_open
        expect(page).to have_selector('#make-a-copy-container', visible: false)
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

  def string_with_1024_chars
    'a' * 1024
  end

  def string_with_254_chars
    string_with_1024_chars[0...254]
  end
end
