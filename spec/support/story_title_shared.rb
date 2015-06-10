require 'rails_helper'

shared_examples 'has_story_title' do

  describe '#title' do

    it 'returns the title of the story' do
      expect(subject.title).to eq('Test Story')
    end
  end
end
