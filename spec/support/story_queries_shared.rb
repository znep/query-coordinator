require 'rails_helper'

shared_examples 'has_story_queries' do

  describe '#from_four_by_four' do

    context 'if a story with the specified four_by_four exists' do

      it 'returns a valid story' do
        result = subject.class.from_four_by_four(subject.four_by_four)
        expect(result).to eq(subject)
      end
    end

    context 'if a story with the specified four_by_four does not exist' do
      it 'returns nil' do
        result = subject.class.from_four_by_four('does_not_exist')
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
