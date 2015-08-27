require 'rails_helper'

RSpec.describe Api::V1::UploadsController, type: :controller do

  describe '#create' do

    # let(:generate_pending_upload_service) { double('generate_pending_upload_service').as_null_object }
    let(:filename) { 'some-filename.png' }
    # let(:url) { "https://s3bucket.aws.com/path/#{filename}" }
    # let(:content_type) { 'image/png' }
    let(:mock_pending_upload) { double('pending_upload').as_null_object }

    let(:params) do
      {
        upload: {
          filename: filename
        }
      }
    end

    # before do
    #   allow(GeneratePendingUpload).to receive(:new).with(filename).and_return(pending_upload)
    # end

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

      it 'creates PendingUpload object' do
        expect(PendingUpload).to receive(:new).with(filename).and_call_original
        expect_any_instance_of(PendingUpload).to receive(:url).and_return('a_fake_url_for_testing')

        post :create, params

        response_json = JSON.parse(response.body)

        expect(response_json['upload']['url']).to eq('a_fake_url_for_testing')
        expect(response_json['upload']['content_type']).to eq('image/png')
      end

      it 'renders json' do
        post :create, params
        expect(response.content_type).to eq('application/json')
      end

      it 'returns success' do
        post :create, params
        expect(response).to be_created
      end
    end
  end
end
