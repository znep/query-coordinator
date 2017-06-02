require 'rails_helper'

RSpec.describe PublishedStoryBlockIdsMigration, type: :model do
  it 'has a valid factory' do
    expect(FactoryGirl.build(:published_story_block_ids_migration)).to be_valid
  end

  describe '#from_story' do
    let(:story) { FactoryGirl.create(:published_story) }
    let(:result) { PublishedStoryBlockIdsMigration.from_published_story(story) }

    it 'sets original_block_ids from story' do
      expect(result.original_block_ids).to eq(story.block_ids)
    end

    it 'sets keeps reference to PublishedStory' do
      expect(result.published_story).to eq(story)
    end

    it 'does not save returned object' do
      expect(result).to_not be_persisted
    end
  end
end
