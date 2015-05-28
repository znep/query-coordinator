require 'rails_helper'

RSpec.describe PublishedStory, type: :model do

  describe 'validations' do

    it 'has a valid factory' do
      valid_published_story = FactoryGirl.build(:published_story)
      expect(valid_published_story).to be_valid
    end

    it 'does not allow a null value for :four_by_four' do
      invalid_published_story = FactoryGirl.build(:published_story, four_by_four: nil)
      invalid_published_story.valid?
      expect(invalid_published_story.errors[:four_by_four].length).to eq(2)
    end

    it 'does not allow a non-pattern-matching value for :four_by_four' do
      invalid_published_story = FactoryGirl.build(:published_story, four_by_four: 'test')
      invalid_published_story.valid?
      expect(invalid_published_story.errors[:four_by_four].length).to eq(1)
    end

    it 'does not allow a non-array value for :blocks' do
      invalid_published_story = FactoryGirl.build(:published_story, blocks: nil)
      invalid_published_story.valid?
      expect(invalid_published_story.errors[:blocks].length).to eq(1)
    end

    it 'does not allow a null value for :created_by' do
      invalid_published_story = FactoryGirl.build(:published_story, created_by: nil)
      invalid_published_story.valid?
      expect(invalid_published_story.errors[:created_by].length).to eq(1)
    end
  end

  describe '#retrieve_blocks' do

    context 'when storty does not have blocks' do
      it 'returns no blocks' do
        story = FactoryGirl.build(:published_story)
        expect(story.retrieve_blocks).to eq([])
      end
    end

    context 'when story has blocks' do
      it 'returns blocks' do
        block_count = 3
        story = FactoryGirl.build(:published_story_with_blocks, block_count: block_count)
        expect(story.retrieve_blocks.size).to eq(block_count)
      end
    end
  end
end
