require 'rails_helper'

RSpec.describe Api::V1::PublishedStoriesController, type: :controller do

  describe '#create' do

    let(:params) do
      {
        uid: 'four-four'
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
      before do
        stub_valid_session
      end

      it 'returns success' do
        post :create, params
        expect(response).to be_created
      end
    end

  end
end
