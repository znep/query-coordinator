require 'rails_helper'

RSpec.describe Api::V1::PublishedStoriesController, type: :controller do

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
      let(:published) { true }

      before do
        mocked_errors = double('errors', :messages => 'rawr')
        mocked_story_publisher = double('StoryPublisher', :story => true, :errors => mocked_errors)
        allow(mocked_story_publisher).to receive(:publish) { published }
        allow(StoryPublisher).to receive(:new).and_return(mocked_story_publisher)
        stub_valid_session
      end

      describe 'when a story publishes successfully' do
        it 'should return success after publishing a story' do
          post :create, params
          expect(response.status).to eq(200)
          expect(response.body).to eq('true')
        end
      end

      describe 'when a story fails to publish' do
        let(:published) { false }

        it 'should return an error' do
          post :create, params
          expect(response.status).to eq(500)
        end
      end
    end
  end
end
