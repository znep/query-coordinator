require 'rails_helper'

RSpec.describe ProfileHelper, type: :helper do

  describe '#view_url' do
    let(:view) { double('view', rights: rights, id: 'four-four', story?: view_is_story) }
    let(:view_is_story) { true }
    let(:viewing_self) { true }
    let(:rights) { [] }

    before do
      allow_any_instance_of(ProfileHelper).to receive(:viewing_self?).and_return(viewing_self)
    end

    describe 'when encountering a story view' do
      describe 'when view doesn\'t have rights' do
        let(:rights) { nil }

        it 'returns a url with nothing at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four')
        end
      end

      describe 'when the user has neither "write" nor "read"' do
        it 'returns a url with nothing at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four')
        end
      end

      describe 'when the user has "write" view rights' do
        let(:rights) { ['write'] }

        it 'returns a url with /edit at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four/edit')
        end
      end

      describe 'when the user has "read" view rights only' do
        let(:rights) { ['read'] }

        it 'returns a url with /preview at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four/preview')
        end
      end
    end
  end
end
