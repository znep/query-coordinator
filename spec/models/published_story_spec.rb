require 'rails_helper'

RSpec.describe PublishedStory, type: :model do

  let(:subject) { FactoryGirl.create(:published_story) }

  it_behaves_like 'has_block_operations'
  it_behaves_like 'has_story_queries'
  it_behaves_like 'has_story_as_json'

  describe 'validations' do
    it 'has a valid factory' do
      valid_published_story = FactoryGirl.build(:published_story)
      expect(valid_published_story).to be_valid
    end

    it 'does not allow a null value for :uid' do
      invalid_published_story = FactoryGirl.build(:published_story, uid: nil)
      invalid_published_story.valid?
      expect(invalid_published_story.errors[:uid].length).to eq(2)
    end

    it 'does not allow a non-pattern-matching value for :uid' do
      invalid_published_story = FactoryGirl.build(:published_story, uid: 'test')
      invalid_published_story.valid?
      expect(invalid_published_story.errors[:uid].length).to eq(1)
    end

    it 'does not allow a non-array value for :block_ids' do
      invalid_published_story = FactoryGirl.build(:published_story, block_ids: nil)
      invalid_published_story.valid?
      expect(invalid_published_story.errors[:block_ids].length).to eq(1)
    end

    it 'does not allow a null value for :created_by' do
      invalid_published_story = FactoryGirl.build(:published_story, created_by: nil)
      invalid_published_story.valid?
      expect(invalid_published_story.errors[:created_by].length).to eq(1)
    end
  end

  describe '#from_draft_story' do
    let(:draft_story) { FactoryGirl.create(:draft_story) }
    let(:result) { PublishedStory.from_draft_story(draft_story) }

    it 'is a PublishedStory' do
      expect(result).to be_a(PublishedStory)
    end

    it 'is not persisted' do
      expect(result).to_not be_persisted
    end

    it 'does not get timestamps assigned' do
      expect(result.created_at).to be_nil
      expect(result.updated_at).to be_nil
      expect(result.deleted_at).to be_nil
    end

    it 'does not get created_by assigned' do
      expect(result.created_by).to be_nil
    end
  end
end
