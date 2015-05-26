require 'rails_helper'

RSpec.describe DraftStory, type: :model do

  describe 'validations' do

    it 'has a valid factory' do
      valid_draft_story = FactoryGirl.build(:draft_story)
      expect(valid_draft_story).to be_valid
    end

    it 'does not allow a null value for :four_by_four' do
      invalid_draft_story = FactoryGirl.build(:draft_story, four_by_four: nil)
      invalid_draft_story.valid?
      expect(invalid_draft_story.errors[:four_by_four].length).to eq(2)
    end

    it 'does not allow a non-pattern-matching value for :four_by_four' do
      invalid_draft_story = FactoryGirl.build(:draft_story, four_by_four: 'test')
      invalid_draft_story.valid?
      expect(invalid_draft_story.errors[:four_by_four].length).to eq(1)
    end

    it 'does not allow a non-array value for :blocks' do
      invalid_draft_story = FactoryGirl.build(:draft_story, blocks: nil)
      invalid_draft_story.valid?
      expect(invalid_draft_story.errors[:blocks].length).to eq(1)
    end

    it 'does not allow a null value for :created_by' do
      invalid_draft_story = FactoryGirl.build(:draft_story, created_by: nil)
      invalid_draft_story.valid?
      expect(invalid_draft_story.errors[:created_by].length).to eq(1)
    end

    it 'does not allow a null value for :created_at' do
      invalid_draft_story = FactoryGirl.build(:draft_story, created_at: nil)
      invalid_draft_story.valid?
      expect(invalid_draft_story.errors[:created_at].length).to eq(1)
    end
  end
end
