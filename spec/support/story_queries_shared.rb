require 'rails_helper'

shared_examples 'has_story_queries' do

  describe '#find_by_four_by_four' do

    context 'if a story with the specified four_by_four exists' do

      it 'returns a valid story' do
        result = subject.class.find_by_four_by_four(subject.uid)
        expect(result).to eq(subject)
      end

      it 'returns the most recent non-deleted story' do
        four_by_four = 'abcd-9876'
        # Deleted story
        FactoryGirl.create(
          subject.class,
          uid: four_by_four,
          created_at: Time.now,
          deleted_at: Time.now
        )
        # Existing story
        first_non_deleted_story_revision = FactoryGirl.create(
          subject.class,
          uid: four_by_four,
          created_at: Time.now - 1.day
        )
        result = subject.class.find_by_four_by_four(four_by_four)
        expect(result).to eq(first_non_deleted_story_revision)
      end

    end

    context 'if a story with the specified four_by_four does not exist' do
      it 'returns nil' do
        result = subject.class.find_by_four_by_four('does_not_exist')
        expect(result).to be_nil
      end
    end

    context 'when all revisions of a story are deleted' do

      it 'returns nil' do
        # Create already deleted stories
        four_by_four = '1234-efgh'
        FactoryGirl.create(
          subject.class,
          uid: four_by_four,
          created_at: Time.now,
          deleted_at: Time.now
        )
        FactoryGirl.create(
          subject.class,
          uid: four_by_four,
          created_at: Time.now - 1.day,
          deleted_at: Time.now
        )
        result = subject.class.find_by_four_by_four(four_by_four)
        expect(result).to be_nil
      end
    end


  end

  # These tests have been disabled until we enable the .from_four_by_four_and_time
  # method in the StoryQueries concern.
  # describe '#from_four_by_four_and_time' do
  #   context 'if a story with the specified four_by_four and created_at timestamp exists' do
  #     it 'returns a valid story' do
  #       result = subject.class.from_four_by_four_and_time(subject.four_by_four, subject.created_at)
  #       expect(result).to eq(subject)
  #     end
  #   end
  #   context 'if a story with the specified four_by_four and created_at timestamp does not exist' do
  #     it 'returns nil' do
  #       result = subject.class.from_four_by_four_and_time(subject.four_by_four, 'does_not_exist')
  #       expect(result).to eq(nil)
  #     end
  #   end
  # end
end
