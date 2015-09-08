require 'rails_helper'

RSpec.describe PublishedStory, type: :model do

  let(:subject) { FactoryGirl.create(:published_story) }

  it_behaves_like 'has_block_operations'
  it_behaves_like 'has_story_queries'
  it_behaves_like 'has_story_as_json'

  describe 'immutability' do

    context 'when it has not been saved' do

      let(:subject) { FactoryGirl.build(:published_story) }

      it 'can be saved once' do
        expect(subject.save).to eq(true)
      end

      it 'cannot be saved twice' do
        expect(subject.save).to eq(true)
        expect {
          subject.save
        }.to raise_error(ActiveRecord::ReadOnlyRecord)
      end
    end
  end

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

  describe 'default attributes' do
    it 'returns a default theme when theme is not set' do
      story_with_no_theme = FactoryGirl.build(:published_story, theme: nil)
      expect(story_with_no_theme.theme).to eq('classic')
    end

    it 'returns a theme when the theme is set' do
      story_with_serif_theme = FactoryGirl.build(:published_story, theme: 'serif')
      expect(story_with_serif_theme.theme).to eq('serif')
    end
  end

  describe '#from_draft_story' do
    it 'returns an instance of PublishedStory with the assigned attributes' do
      draft_story = FactoryGirl.build(:draft_story, created_by: nil)
    end
  end
end
