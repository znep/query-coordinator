require 'rails_helper'

RSpec.describe DraftStory, type: :model do

  let(:subject) { FactoryGirl.create(:draft_story) }

  it_behaves_like 'has_block_operations'
  it_behaves_like 'has_story_queries'
  it_behaves_like 'has_story_title'
  it_behaves_like 'has_as_json'

  describe 'immutability' do

    context 'when it has not been saved' do

      let(:subject) { FactoryGirl.build(:draft_story) }

      it 'can be saved once' do
        expect(subject.save).to eq(true)
      end

      it 'cannot be saved twice' do
        expect(subject.save).to eq(true)
        expect {
          subject.save
        }.to raise_error
      end
    end
  end

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

    it 'does not allow a non-array value for :block_ids' do
      invalid_draft_story = FactoryGirl.build(:draft_story, block_ids: nil)
      invalid_draft_story.valid?
      expect(invalid_draft_story.errors[:block_ids].length).to eq(1)
    end

    it 'does not allow a null value for :created_by' do
      invalid_draft_story = FactoryGirl.build(:draft_story, created_by: nil)
      invalid_draft_story.valid?
      expect(invalid_draft_story.errors[:created_by].length).to eq(1)
    end
  end
end
