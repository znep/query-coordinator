require 'rails_helper'

RSpec.describe Api::V1::PublishedController, type: :controller do

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
      let(:user_authorization) { mock_user_authorization }
      let(:mock_story_publisher) { double('StoryPublisher') }
      let(:success) { nil }
      let(:published_story) { FactoryGirl.create(:published_story) }

      before do
        allow(StoryPublisher).to receive(:new).and_return(mock_story_publisher)
        allow(mock_story_publisher).to receive(:publish) { success }
        allow(mock_story_publisher).to receive(:story).and_return(published_story)
        stub_valid_session
      end

      it 'calls StoryPublisher#publish' do
        expect(StoryPublisher).to receive(:new).with(user, user_authorization, params).and_return(mock_story_publisher)
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
end
