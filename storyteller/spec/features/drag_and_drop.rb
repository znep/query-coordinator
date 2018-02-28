require 'rails_helper'

RSpec.describe 'Drag and Drop', type: :feature, js: true do
  let(:block_count) { 4 }

  def drag_start(x, y)
    page.execute_script(%{
      storyteller.dragDrop.pointerDown(
        {
          target: $('.inspiration-block').first()[0],
          type: 'mousedown'
        },
        {
          target: $('.inspiration-block').first(),
          pageX: #{x},
          pageY: #{y},
        }
      );

      storyteller.dragDrop.dragStart();
    })
  end

  def drag_end()
    page.execute_script(%{
      storyteller.dragDrop.dragEnd(
        {},
        {
          target: $('.block').first()
        }
      );
    })
  end

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('hasb-lock')
    stub_current_domain

    set_feature_flags('enable_getty_images_gallery' => true, 'use_fontana_approvals' => true)

    visit '/s/magic-thing/hasb-lock/edit'
  end

  after do
    unload_page_and_dismiss_confirmation_dialog
  end

  describe 'dragging and adding a new block' do

    before do
      drag_start(300, 100)
      page.first('.block').hover
    end

    after do
      drag_end
    end

    it 'adds a new block' do
      drag_end
      expect(page).to have_selector('.user-story .block', count: block_count + 1)
    end

    it 'adds an insertion hint to indicate dropzone' do
      expect(page).to have_selector('#story-insertion-hint')
    end

    it 'adds a block ghost to indicate dragging' do
      expect(page).to have_selector('#block-ghost')
    end

    it 'blinds rich text editors with a component-blinder' do
      expect(page).to have_selector('.component-blinder')
    end
  end

  describe 'dragging and not adding a new block' do

    before do
      drag_start(300, 100)
      drag_end
    end

    it 'does not add a block' do
      drag_start(300, 100)
      expect(page).to have_selector('.user-story .block', count: block_count)
      drag_end
      expect(page).to have_selector('.user-story .block', count: block_count)
    end

    it 'hides component blinders' do
      expect(page).to_not have_selector('#story-insertion-hint')
    end

    it 'hides block ghost' do
      expect(page).to_not have_selector('#block-ghost')
    end

    it 'hides insertion hint' do
      expect(page).to_not have_selector('.component-blinder')
    end
  end
end
