require 'rails_helper'

RSpec.describe InspirationStory, type: :model do
  let(:inspiration_story) { InspirationStory.new() }

  describe '#as_json' do
    let(:as_json) { inspiration_story.as_json }

    it 'returns parsable json' do
      expect do
        JSON.parse(as_json)
      end.to_not raise_error
    end

    it 'returns json containing the key "blocks"' do
      expect(JSON.parse(as_json)).to have_key('blocks')
    end

  end
end
