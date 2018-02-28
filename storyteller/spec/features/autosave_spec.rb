require 'rails_helper'

RSpec.describe 'autosave', type: :feature, js: true do
  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('hasb-lock')
    stub_current_domain
    stub_approvals_settings

    set_feature_flags('enable_getty_images_gallery' => true, 'use_fontana_approvals' => true)

    visit '/s/magic-thing/hasb-lock/edit'

    @preview_btn = page.find('.preview-btn')
  end

  # Get the seconds to wait.
  def expected_delay_before_autosave
    2
    # @expected_delay ||= page.evaluate_script(
    #   'storyteller.config.autosaveDebounceTimeInSeconds'
    # ).to_f
  end

  # Get number of blocks in the current story
  def block_count
    page.evaluate_script(
      'storyteller.storyStore.getStoryBlockIds(window.STORY_UID).length'
    )
  end

  def is_story_dirty?
    page.evaluate_script(
      'storyteller.storySaveStatusStore.isStoryDirty()'
    )
  end

  def digest
    page.evaluate_script(
      'storyteller.storyStore.getStoryDigest(STORY_UID)'
    )
  end

  let(:data_toggle_selector) { 'button[data-panel-toggle="add-content-panel"]' }
  def trigger_change!
    # copying from undo_redo_spec#L73
    initial_block_count = block_count
    page.all(data_toggle_selector).first().click
    page.evaluate_script('$(".inspiration-block").eq(0).dblclick()');
    expect(block_count).to eq(initial_block_count + 1)
  end

  def preview_disabled?
    @preview_btn[:class].split(' ').include? 'disabled'
  end

  it 'should trigger when a change occurs' do
    # On page load, the starting state is 'saved'.
    expect(is_story_dirty?).to be_falsey
    expect(preview_disabled?).to be_falsey
    original_digest = digest

    trigger_change!

    wait_until do
      digest != original_digest
    end

    wait_until do
      !is_story_dirty? && !preview_disabled?
    end
  end
end
