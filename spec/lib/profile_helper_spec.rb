require 'rails_helper'

RSpec.describe ProfileHelper, type: :helper do

  describe '#view_url' do
    let(:is_story) { true }
    let(:is_data_lens) { false }
    let(:can_edit_story) { true }
    let(:can_preview_story) { true }
    let(:viewing_others_profile) { false }

    let(:view) do
      double(
        'view',
        id: 'four-four',
        name: 'test view name',
        can_edit_story?: can_edit_story,
        can_preview_story?: can_preview_story,
        canonical_domain_name: 'example.com',
        story?: is_story,
        data_lens?: false,
        is_api?: false,
        standalone_visualization?: false)
    end

    before do
      allow_any_instance_of(ProfileHelper).to receive(:viewing_others_profile?).and_return(viewing_others_profile)
      allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(nil)
    end

    describe 'when encountering a non-story view' do
      let(:is_story) { false }
      it 'returns the url from Socrata::UrlHelpers' do
        allow_any_instance_of(Socrata::UrlHelpers).to receive(:view_url).and_return('mocked')
        expect(view_url(view)).to eq('mocked')
      end
    end

    describe 'when encountering a story view' do
      describe "when the user is looking at someone else's profile" do
        let(:viewing_others_profile) { true }
        let(:can_edit_story) { true }
        let(:can_preview_story) { true }
        it 'returns the view mode url' do
          expect(view_url(view)).to eq('//example.com/stories/s/test-view-name/four-four')
        end
      end
      describe 'when the user has owner access' do
        let(:viewing_others_profile) { false }
        let(:can_edit_story) { true }
        let(:can_preview_story) { true }
        it 'returns a url with /edit at the end' do
          expect(view_url(view)).to eq('//example.com/stories/s/test-view-name/four-four/edit')
        end
      end

      describe 'when the user has viewer access' do
        let(:viewing_others_profile) { false }
        let(:can_edit_story) { false }
        let(:can_preview_story) { true }
        it 'returns a url with /preview at the end' do
          expect(view_url(view)).to eq('//example.com/stories/s/test-view-name/four-four/preview')
        end
      end

      describe 'when the user has no access' do
        let(:viewing_others_profile) { false }
        let(:can_edit_story) { false }
        let(:can_preview_story) { false }
        it 'returns the published view url' do
          expect(view_url(view)).to eq('//example.com/stories/s/test-view-name/four-four')
        end
      end
    end
  end
end
