require 'rails_helper'

RSpec.describe 'presentation mode', type: :feature, js: true do
  let(:presentation_mode_selector) { '.btn-presentation-mode:not(:disabled)' }
  let(:presentation_mode_selector_disabled) { '.btn-presentation-mode:disabled' }
  let(:presentation_nav) { '.presentation-navigation' }
  let(:presentation_nav_previous) { '.btn-presentation-previous' }
  let(:presentation_nav_next) { '.btn-presentation-next' }
  let(:linear_mode_selector) { '.btn-linear-mode:not(:disabled)' }
  let(:linear_mode_selector_disabled) { '.btn-linear-mode:disabled' }
  let(:valid_showing_block_selector) { '.block[data-page-index]:not(.hidden)' }
  let(:valid_hidden_block_selector) { '.block[data-page-index].hidden' }
  let(:blacklisted_showing_block_selector) { '.block:not([data-page-index])' }
  let(:blacklisted_hidden_block_selector) { '.block:not([data-page-index]).hidden' }

  before do
    stub_logged_in_user
    stub_core_view('pres-ents')
    visit '/s/magic-thing/pres-ents?preview=true'
  end

  it 'toggles linear and presentation mode' do
    presentation_mode = page.all(presentation_mode_selector).first()
    linear_mode = page.all(linear_mode_selector_disabled).first()

    expect_linear_mode_to_be_on
    expect_presentation_mode_to_be_off
    expect_presentation_navigation_to_be_off

    presentation_mode.click()

    expect_linear_mode_to_be_off
    expect_presentation_mode_to_be_on
    expect_presentation_navigation_to_be_on

    linear_mode.click()

    expect_linear_mode_to_be_on
    expect_presentation_mode_to_be_off
    expect_presentation_navigation_to_be_off
  end

  it 'opens presentation mode and uses presentation navigation next' do
    presentation_mode = page.all(presentation_mode_selector).first()

    presentation_mode.click()

    presentation_next = page.all(presentation_nav_next).first()

    expect_presentation_mode_to_be_on
    expect_presentation_navigation_to_be_on

    currently_showing_block = page.all(valid_showing_block_selector).first()
    estimated_next_showing_block = currently_showing_block['data-page-index'].last.to_i + 1

    presentation_next.click()

    currently_showing_block = page.all(valid_showing_block_selector).first()['data-page-index'].last.to_i

    expect(currently_showing_block).to equal(estimated_next_showing_block)
  end

  it 'opens presentation mode and uses presentation navigation previous' do
    presentation_mode = page.all(presentation_mode_selector).first()
    presentation_prev = page.all(presentation_nav_previous, :visible => false).first()
    presentation_next = page.all(presentation_nav_next, :visible => false).first()

    presentation_mode.click()

    expect_presentation_mode_to_be_on
    expect_presentation_navigation_to_be_on

    presentation_next.click()

    currently_showing_block = page.all(valid_showing_block_selector).first()
    estimated_next_showing_block = currently_showing_block['data-page-index'].last.to_i - 1

    presentation_prev.click()

    currently_showing_block = page.all(valid_showing_block_selector).first()['data-page-index'].last.to_i

    expect(currently_showing_block).to equal(estimated_next_showing_block)
  end

  it 'opens presentation mode and excludes blacklisted blocks' do
    linear_mode = page.all(linear_mode_selector_disabled).first()
    presentation_mode = page.all(presentation_mode_selector).first()
    presentation_mode.click()

    blacklisted_elements = page.all(blacklisted_hidden_block_selector, :visible => false)
    expect(blacklisted_elements).not_to be_empty

    linear_mode.click()

    blacklisted_elements = page.all(blacklisted_hidden_block_selector, :visible => false)
    expect(blacklisted_elements).to be_empty
  end

  def expect_presentation_mode_to_be_off
    expect(page).to have_selector(presentation_mode_selector)
  end

  def expect_presentation_mode_to_be_on
    expect(page).to have_selector(presentation_mode_selector_disabled)
  end

  def expect_linear_mode_to_be_off
    expect(page).to have_selector(linear_mode_selector)
  end

  def expect_linear_mode_to_be_on
    expect(page).to have_selector(linear_mode_selector_disabled)
  end

  def expect_presentation_navigation_to_be_off
    expect(page).to have_selector(presentation_nav, visible: false)
  end

  def expect_presentation_navigation_to_be_on
    expect(page).to have_selector(presentation_nav, visible: true)
  end
end
