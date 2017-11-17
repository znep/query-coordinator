require 'rails_helper'

RSpec.describe 'settings panel', type: :feature, js: true do
  let(:data_toggle_selector) { '[data-panel-toggle="settings-panel"]' }
  let(:settings_panel_selector) { '.settings-panel' }
  let(:settings_overlay_selector) { '#settings-panel-overlay' }
  let(:settings_title_description) { '.settings-panel .menu-list-item:first-child .menu-list-item-header' }
  let(:settings_make_copy) { '.settings-panel .menu-list-item:nth-child(2) .menu-list-item-header' }
  let(:settings_share_embed) { '.settings-panel .menu-list-item:nth-child(5) .menu-list-item-header' }

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_current_user_story_authorization(mock_user_authorization_owner_publisher)
    stub_core_view('hasb-lock', {
      'rights' => ['update_view'],
      'owner' => {
        'id' => 'tugg-xxxx'
      }
    })
    stub_current_domain

    set_feature_flags('enable_getty_images_gallery' => true)

    visit '/s/magic-thing/hasb-lock/edit'
  end

  it 'closes on overlay click' do
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
  end

  it 'closes on X button click' do
    first_toggle = page.all(data_toggle_selector).first()
    # Expect initial state
    expect_settings_panel_to_be_closed
    expect(page.find('header')).to have_selector(data_toggle_selector, count: 2)

    # Open the panel
    first_toggle.click()

    # Close with close button
    page.find("#{settings_panel_selector} .close-side-panel-btn").click()
    expect_settings_panel_to_be_closed
  end

  it 'closes on ESC' do
    first_toggle = page.all(data_toggle_selector).first()
    # Expect initial state
    expect_settings_panel_to_be_closed
    expect(page.find('header')).to have_selector(data_toggle_selector, count: 2)

    # Open the panel
    first_toggle.click()

    # Close with the esc key
    page.find('body').native.send_keys(:escape)
    expect_settings_panel_to_be_closed
  end

  describe 'title' do
    before do
      open_pane

      page.find(settings_title_description).click
      # Dummy action to force capybara to wait for the selector to return nonempty
      page.find('#settings-panel-story-metadata .active').visible?
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
      open_pane

      page.find(settings_make_copy).click
    end

    it 'shows the modal' do
      expect(page).to have_selector('#make-a-copy-container', visible: true)
    end

    context 'when you close the modal' do
      before do
        page.find('#make-a-copy-container .make-a-copy-button-group button.back-btn').
          click
      end

      it 'opens settings panel and hides the modal' do
        expect_settings_panel_to_be_open
        expect(page).to have_selector('#make-a-copy-container', visible: false)
      end
    end
  end

  describe 'share and embed' do
    before do
      open_pane

      page.find(settings_share_embed).click
    end

    it 'shows the modal' do
      expect(page).to have_selector('#share-and-embed-modal', visible: true)
    end

    it 'updates the preview when you type' do
      override_title = 'title override'
      override_description = 'description override'

      modal = page.find('#share-and-embed-modal')

      modal.find('.nav-tabs li:not(.current)').click

      fill_in('embed-title', with: override_title)
      fill_in('embed-description', with: override_description)

      modal.find('.nav-tabs li:not(.current)').click

      within_frame(page.find('#share-and-embed-modal iframe')) do
        expect(page.find('.tile-title')).to have_content(override_title)
        expect(page.find('.tile-description')).to have_content(override_description)
      end
    end

    context 'when you click save & close' do
      before do
        page.find('#share-and-embed-modal .modal-button-group .btn-primary').click
      end

      it 'hides the modal' do
        expect_settings_panel_to_be_open
        expect(page).to have_selector('#share-and-embed-modal', visible: false)
      end
    end

    context 'when you click cancel' do
      before do
        page.find('#share-and-embed-modal .modal-button-group .btn-default').click
      end

      it 'hides the modal' do
        expect_settings_panel_to_be_open
        expect(page).to have_selector('#share-and-embed-modal', visible: false)
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

  def open_pane
    # Wait for existing animations. If you can come up with a good
    # reliable selector for this, be my guest :)
    sleep(0.5)

    return unless page.all('#settings-panel-container.active').empty?
    first_toggle = page.all(data_toggle_selector).first()
    first_toggle.click()
    # Dummy action to force capybara to wait for the selector to return nonempty
    # I.e., wait for panel to open.
    page.find('#settings-panel-container.active').visible?
    sleep 0.5 # See comment at the top of this function.
  end

  def string_with_1024_chars
    'a' * 1024
  end

  def string_with_254_chars
    string_with_1024_chars[0...254]
  end
end
