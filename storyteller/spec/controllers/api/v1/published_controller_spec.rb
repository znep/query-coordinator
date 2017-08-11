require 'rails_helper'

RSpec.describe Api::V1::PublishedController, type: :controller do

  before do
    request.env['HTTPS'] = 'on' # otherwise we get redirected to HTTPS for all requests.
  end

  describe '#latest' do
    let(:params) do
      {
        uid: 'four-four'
      }
    end

    before do
      stub_sufficient_rights
      allow(PublishedStory).to receive(:find_by_uid).and_return(story)
    end

    describe 'no published version present' do
      let(:story) { nil }

      it '404s' do
        get :latest, params
        expect(response.status).to be(404)
      end
    end

    describe 'published version present' do
      let(:story) { { mock: 'story' } }

      it '200s' do
        get :latest, params
        expect(response.status).to be(200)
        expect(response.body).to eq(story.to_json)
      end
    end
  end

  describe '#create' do

    let(:params) do
      {
        uid: 'four-four',
        digest: 'something'
      }
    end

    context 'when not authenticated' do
      before do
        stub_invalid_session
      end

      it 'redirects' do
        post :create, params
        expect(response).to be_redirect
      end
    end

    context 'when authenticated' do
      let(:user) { mock_valid_user }
      let(:mock_story_publisher) { double('StoryPublisher') }
      let(:success) { nil }
      let(:published_story) { FactoryGirl.create(:published_story) }

      before do
        stub_sufficient_rights
        allow(StoryPublisher).to receive(:new).and_return(mock_story_publisher)
        allow(mock_story_publisher).to receive(:publish) { success }
        allow(mock_story_publisher).to receive(:story).and_return(published_story)
        stub_valid_session
        stub_core_view(params[:uid])
      end

      it 'calls StoryPublisher#publish' do
        expect(StoryPublisher).to receive(:new).with(user, instance_of(CorePermissionsUpdater), params).and_return(mock_story_publisher)
        expect(mock_story_publisher).to receive(:publish)
        post :create, params
      end

      describe 'when a story publishes successfully' do
        let(:success) { true }

        it 'returns success' do
          post :create, params
          expect(response.status).to eq(200)
        end

        it 'renders published story with :isPublic set to true' do
          post :create, params
          json_response = JSON.parse(response.body)
          expected_json = published_story.attributes.tap{ |attrs| attrs['isPublic'] = true }
          expect(response.body).to eq(expected_json.to_json)
        end
      end

      describe 'when a story fails to publish' do
        let(:success) { false }

        it 'returns an error' do
          post :create, params
          expect(response.status).to eq(500)
        end
      end
    end
  end

  describe '#handle_authorization' do
    let(:action) { :nothing }
    let(:get_request) { get action, uid: 'test-test' }

    before do
      stub_core_view('test-test')
      stub_valid_session
    end

    describe '#latest' do
      let(:action) { :latest }
      let(:is_inaccessible) { true }

      before do
        allow(CoreServer).to(
          receive(:view_inaccessible?).
            with('test-test').
            and_return(is_inaccessible)
        )
      end

      describe 'story not accessible' do
        let(:is_inaccessible) { true }

        it '404s' do
          get_request
          expect(response.status).to be(404)
        end
      end

      describe 'story accessible' do
        let(:is_inaccessible) { false }

        it 'does not 403' do
          get_request
          expect(response.status).to_not be(403)
        end
      end
    end

    describe 'when creating a published story' do
      let(:edit_others_stories) { false }
      let(:owner) { false }
      let(:action) { 'create' }

      before do
        story = double('story', :attributes => {})
        story_publisher = instance_double('story_publisher', :publish => true, :story => story)

        
        allow_any_instance_of(ApplicationController).to receive(:has_domain_right?).with('edit_others_stories').and_return(edit_others_stories)
        allow_any_instance_of(ApplicationController).to receive(:owner?).and_return(owner)
        allow(StoryPublisher).to receive(:new).and_return(story_publisher)
      end

      describe 'and the user has the edit_others_stories right' do
        let(:edit_others_stories) { true }

        it 'does not 403' do
          get_request
          expect(response.status).to_not be(403)
        end
      end

      describe 'and the user is an owner' do
        let(:owner) { true }

        it 'does not 403' do
          get_request
          expect(response.status).to_not be(403)
        end
      end

      describe 'and the user is neither admin nor owner' do
        it '403s' do
          get_request
          expect(response.status).to be(403)
        end
      end
    end

  end
end
