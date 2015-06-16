require 'rails_helper'

shared_examples 'has_story_as_json' do

  describe '#as_json' do

    it "filters out the internal id" do
      expect(subject.as_json['id']).to_not eq(subject.id)
    end

    it "exposes the four by four as 'id'" do
      expect(subject.as_json['id']).to eq(subject.uid)
    end

    it "filters out 'block_ids'" do
      expect(subject.as_json).to_not include('block_ids')
    end

    it "filters out 'deleted_at'" do
      expect(subject.as_json).to_not include('deleted_at')
    end

    it "includes 'blocks'" do
      expect(subject.as_json).to include('blocks')
    end
  end
end
