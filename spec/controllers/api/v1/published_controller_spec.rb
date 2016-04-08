require 'rails_helper'

RSpec.describe Api::V1::PublishedController, type: :controller do

  describe '#create' do

    let(:params) do
      {
        uid: 'four-four',
        digest: 'something'
      }
    end

    before do
      request.env['HTTPS'] = 'on'
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
      let(:user_authorization) { mock_user_authorization_owner_publisher }
      let(:mock_story_publisher) { double('StoryPublisher') }
      let(:success) { nil }
      let(:published_story) { FactoryGirl.create(:published_story) }

      before do
        stub_sufficient_rights
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

  describe '#handle_authorization' do
    let(:action) { :nothing }
    let(:get_request) { get action, uid: 'test-test' }

    before do
      stub_core_view('test-test')
      stub_valid_session
    end

    describe 'when creating a published story' do
      let(:admin) { false }
      let(:owner) { false }
      let(:action) { 'create' }

      before do
        story = double('story', :attributes => {})
        story_publisher = instance_double('story_publisher', :publish => true, :story => story)

        allow_any_instance_of(ApplicationController).to receive(:admin?).and_return(admin)
        allow_any_instance_of(ApplicationController).to receive(:owner?).and_return(owner)
        allow(StoryPublisher).to receive(:new).and_return(story_publisher)
      end

      describe 'and the user is an admin' do
        let(:admin) { true }

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
