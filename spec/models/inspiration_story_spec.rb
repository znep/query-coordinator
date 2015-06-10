require 'rails_helper'

RSpec.describe InspirationStory, type: :model do
  let(:inspiration_story) { InspirationStory.new() }

  describe '#to_json' do
    let(:to_json) { inspiration_story.to_json }

    it 'returns parsable json' do
      expect do
        JSON.parse(to_json)
      end.to_not raise_error
    end

    it 'returns json containing the key "blocks"' do
      expect(JSON.parse(to_json)).to have_key('blocks')
    end

  end
end
