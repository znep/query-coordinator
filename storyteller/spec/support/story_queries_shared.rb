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

  describe '#find_by_uid_and_digest' do
    # TODO: Tests for this method were missing, but it is also no longer used.
  end

  describe '#next' do
    let(:uid) { 'next-next' }
    let(:now) { Time.zone.now }

    let(:reference) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now
      )
    end

    # mispelled intentionally to sidestep reserved keyword
    let(:nextt) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now + 10.minutes
      )
    end

    let(:nextt_deleted) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now + 5.minutes, deleted_at: now + 5.minutes
      )
    end

    let(:last) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now + 20.minutes
      )
    end

    let(:first) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now - 10.minutes
      )
    end

    context 'if a story with the specified uid exists' do
      it 'returns a valid story' do
        [reference, nextt, first, last]

        result = subject.class.find_next(reference.uid, reference.created_at)
        expect(result).to eq(nextt)

        result = reference.next
        expect(result).to eq(nextt)
      end

      it 'returns the next non-deleted story' do
        [reference, nextt, nextt_deleted]

        result = subject.class.find_next(reference.uid, reference.created_at)
        expect(result).to eq(nextt)

        result = reference.next
        expect(result).to eq(nextt)
      end
    end

    context 'if a story with the specified uid does not exist' do
      it 'returns nil' do
        [reference, nextt, first, last]

        result = subject.class.find_next('bork-bork', reference.created_at)
        expect(result).to be_nil
      end
    end

    context 'when all future revisions of a story are deleted' do
      let(:nextt) do
        FactoryGirl.create(
          subject.class, uid: uid, created_at: now - 10.minutes, deleted_at: now - 10.minutes
        )
      end

      it 'returns nil' do
        [reference, nextt, nextt_deleted]

        result = subject.class.find_next(reference.uid, reference.created_at)
        expect(result).to be_nil

        result = reference.next
        expect(result).to be_nil
      end
    end
  end

  describe '#previous' do
    let(:uid) { 'prev-ious' }
    let(:now) { Time.zone.now }

    let(:reference) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now
      )
    end

    let(:previous) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now - 10.minutes
      )
    end

    let(:previous_deleted) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now - 5.minutes, deleted_at: now - 5.minutes
      )
    end

    let(:first) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now - 20.minutes
      )
    end

    let(:last) do
      FactoryGirl.create(
        subject.class, uid: uid, created_at: now + 10.minutes
      )
    end

    context 'if a story with the specified uid exists' do
      it 'returns a valid story' do
        [reference, previous, first, last]

        result = subject.class.find_previous(reference.uid, reference.created_at)
        expect(result).to eq(previous)

        result = reference.previous
        expect(result).to eq(previous)
      end

      it 'returns the previous non-deleted story' do
        [reference, previous, previous_deleted]

        result = subject.class.find_previous(reference.uid, reference.created_at)
        expect(result).to eq(previous)

        result = reference.previous
        expect(result).to eq(previous)
      end
    end

    context 'if a story with the specified uid does not exist' do
      it 'returns nil' do
        [reference, previous, first, last]

        result = subject.class.find_previous('bork-bork', reference.created_at)
        expect(result).to be_nil
      end
    end

    context 'when all past revisions of a story are deleted' do
      let(:previous) do
        FactoryGirl.create(
          subject.class, uid: uid, created_at: now - 10.minutes, deleted_at: now - 10.minutes
        )
      end

      it 'returns nil' do
        [reference, previous, previous_deleted]

        result = subject.class.find_previous(reference.uid, reference.created_at)
        expect(result).to be_nil

        result = reference.previous
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
