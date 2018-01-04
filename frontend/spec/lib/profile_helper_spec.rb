require 'rails_helper'

RSpec.describe ProfileHelper, type: :helper do

  describe '#view_url' do
    let(:is_story) { true }
    let(:is_draft) { false }
    let(:can_edit) { false }
    let(:category) { nil }
    let(:is_data_lens) { false }
    let(:can_edit_story) { true }
    let(:can_preview_story) { true }
    let(:viewing_others_profile) { false }
    let(:is_visualization_canvas) { false }
    let(:is_op_measure) { false }

    let(:view) do
      double(
        'view',
        id: 'four-four',
        name: 'test view name',
        can_edit_story?: can_edit_story,
        can_preview_story?: can_preview_story,
        canonical_domain_name: 'example.com',
        story?: is_story,
        draft?: is_draft,
        can_edit?: can_edit,
        data_lens?: false,
        category: category,
        is_api?: false,
        visualization_canvas?: is_visualization_canvas,
        op_measure?: is_op_measure
      )
    end

    before do
      allow_any_instance_of(ProfileHelper).to receive(:viewing_others_profile?).and_return(viewing_others_profile)
      allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(nil)
      allow_any_instance_of(Socrata::UrlHelpers).to receive(:locale_url_prefix).and_return('')
    end

    describe 'when encountering a non-story view' do
      let(:is_story) { false }
      let(:is_draft) { false }
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

    describe 'when encountering a draft view' do
      before(:each) do
        rspec_stub_feature_flags_with(:enable_dataset_management_ui => true)
      end

      let(:is_story) { false }
      let(:is_draft) { true }

      describe 'when the user has edit rights' do
        let(:can_edit) { true }
        it 'returns a url with /revisions/current at the end' do
          expect(view_url(view)).to eq('/dataset/test-view-name/four-four/revisions/current')
        end
      end

      describe 'when the view has a category' do
        let(:can_edit) { true }
        let(:category) { "Fun" }
        it 'returns a url with the category and /revisions/current at the end' do
          expect(view_url(view)).to eq('/Fun/test-view-name/four-four/revisions/current')
        end
      end

      describe 'when the user does not have edit rights' do
        let(:can_edit) { false }
        it 'returns a url with /revisions/current at the end' do
          allow_any_instance_of(Socrata::UrlHelpers).to receive(:view_url).and_return('mocked')
          expect(view_url(view)).to eq('mocked')
        end
      end
    end

    describe 'when encountering a visualization canvas' do
      let(:is_visualization_canvas) { true }
      let(:is_story) { false }

      describe 'when the user has edit rights' do
        let(:can_edit) { true }
        it 'returns a url with ...' do
          expect(view_url(view)).to eq('//example.com/d/four-four/edit')
        end
      end

      describe "when the user is looking at someone else's profile" do
        let(:viewing_others_profile) { true }

        it 'returns the view mode url' do
          expect(view_url(view)).to eq('//example.com/d/four-four')
        end
      end
    end

    describe 'when encountering a measure' do
      let(:is_op_measure) { true }
      let(:is_story) { false }

      describe 'when the user has edit rights' do
        let(:can_edit) { true }
        it 'returns a url with ...' do
          expect(view_url(view)).to eq('//example.com/d/four-four/edit')
        end
      end

      describe "when the user is looking at someone else's profile" do
        let(:viewing_others_profile) { true }

        it 'returns the view mode url' do
          expect(view_url(view)).to eq('//example.com/d/four-four')
        end
      end
    end
  end
end
