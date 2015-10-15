require 'rails_helper'

module AutosaveSpecHelper
  extend RSpec::Matchers::DSL

  matcher :be_disabled do |expected|
    match do |actual|
      case actual.tag_name
      when 'button'
        actual[:disabled] == 'true'
      when 'a'
        actual[:class].split(' ').include? 'disabled'
      end
    end
  end
end

RSpec.describe 'autosave', type: :feature, js: true do
  include AutosaveSpecHelper

  before do
    stub_logged_in_user
    stub_core_view('hasb-lock')
    visit '/s/magic-thing/hasb-lock/edit'
    page.stub_ajax_request({
      request: {
        # TODO
        # url: /stories/api/v1/stories/[a-z0-9-]{0}/drafts
      },
      response: {
        # TODO
        # response header: 'X-Story-Digest' => 'abc'
      }
    })
    @blocks = page.all('.user-story .block-edit')

    @save_btn = page.find('#story-save-btn')
    @preview_btn = page.find('.preview-btn')
  end

  # Get the seconds to wait.
  def expected_delay_before_autosave
    @expected_delay ||= page.evaluate_script(
      'storyteller.config.autosaveDebounceTimeInMilliseconds'
    ).to_f / 1000
  end

  # Get number of blocks in the current story
  def block_count
    page.evaluate_script(
      'storyteller.storyStore.getStoryBlockIds(storyteller.userStoryUid).length'
    )
  end

  def is_story_dirty?
    page.evaluate_script(
      'storyteller.storySaveStatusStore.isStoryDirty()'
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

  it 'should trigger when a change occurs' do
    # On page load, the starting state is 'saved'.
    expect(@save_btn).to be_disabled
    expect(@preview_btn).not_to be_disabled

    trigger_change!

    # New state: unsaved. Preview disabled.
    expect(is_story_dirty?).to be_truthy
    expect(@save_btn).not_to be_disabled
    expect(@preview_btn).to be_disabled

    # wait expected delay
    sleep(expected_delay_before_autosave)

    # Last state: saved. Preview re-enabled.
    expect(is_story_dirty?).to be_falsey
    expect(@preview_btn).not_to be_disabled

    unload_page_and_dismiss_confirmation_dialog
  end
end
