require 'rails_helper'

shared_examples 'has_story_queries' do

  describe '#find_by_uid' do

    context 'if a story with the specified uid exists' do

      it 'returns a valid story' do
        result = subject.class.find_by_uid(subject.uid)
        expect(result).to eq(subject)
      end

      it 'returns the most recent non-deleted story' do
        uid = 'abcd-9876'
        # Deleted story
        FactoryGirl.create(
          subject.class,
          uid: uid,
          created_at: Time.now,
          deleted_at: Time.now
        )
        # Existing story
        first_non_deleted_story_revision = FactoryGirl.create(
          subject.class,
          uid: uid,
          created_at: Time.now - 1.day
        )
        result = subject.class.find_by_uid(uid)
        expect(result).to eq(first_non_deleted_story_revision)
      end

    end

    context 'if a story with the specified uid does not exist' do
      it 'returns nil' do
        result = subject.class.find_by_uid('does_not_exist')
        expect(result).to be_nil
      end
    end

    context 'when all revisions of a story are deleted' do

      it 'returns nil' do
        # Create already deleted stories
        uid = '1234-efgh'
        FactoryGirl.create(
          subject.class,
          uid: uid,
          created_at: Time.now,
          deleted_at: Time.now
        )
        FactoryGirl.create(
          subject.class,
          uid: uid,
          created_at: Time.now - 1.day,
          deleted_at: Time.now
        )
        result = subject.class.find_by_uid(uid)
        expect(result).to be_nil
      end
    end


  end

  # These tests have been disabled until we enable the .from_uid_and_time
  # method in the StoryQueries concern.
  # describe '#from_uid_and_time' do
  #   context 'if a story with the specified uid and created_at timestamp exists' do
  #     it 'returns a valid story' do
  #       result = subject.class.from_uid_and_time(subject.uid, subject.created_at)
  #       expect(result).to eq(subject)
  #     end
  #   end
  #   context 'if a story with the specified uid and created_at timestamp does not exist' do
  #     it 'returns nil' do
  #       result = subject.class.from_uid_and_time(subject.uid, 'does_not_exist')
  #       expect(result).to eq(nil)
  #     end
  #   end
  # end
end
