require 'rails_helper'

RSpec.describe Api::V1::DocumentsController, type: :controller do

  describe '#create' do

    let(:create_document_service) { double('create_document_service').as_null_object }
    let(:direct_upload_url) { "https://#{Rails.application.secrets.aws['s3_bucket_name']}.s3.amazonaws.com/uploads/random/#{upload_file_name}" }
    let(:upload_content_type) { 'image/jpeg' }
    let(:upload_file_name) { 'thefilename.jpg' }
    let(:upload_file_size) { 3884732 }
    let(:story_uid) { 'four-four' }

    let(:document) { FactoryGirl.create(:document, params[:document]) }

    let(:params) do
      {
        document: {
          story_uid: story_uid,
          direct_upload_url: direct_upload_url,
          upload_content_type: upload_content_type,
          upload_file_name: upload_file_name,
          upload_file_size: upload_file_size
        }
      }
    end

    before do
      allow(CreateDocument).to receive(:new).and_return(create_document_service)
      allow(create_document_service).to receive(:document).and_return(document)
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

      it 'renders new document json' do
        post :create, params
        response_json = JSON.parse(response.body)

        expect(response_json['document']['id']).to eq(document.id)
        expect(response_json['document']['upload_file_name']).to eq(document.upload_file_name)
        expect(response_json['document']['upload_file_size']).to eq(document.upload_file_size)
        expect(response_json['document']['upload_content_type']).to eq(document.upload_content_type)
        expect(response_json['document']['status']).to eq(document.status)
        expect(response_json['document']['url']).to eq(document.upload.url)
      end

      context 'when CreateDocument service fails' do

        # used to create some errors for the test below
        let(:document) { Document.create(params[:document].except(:direct_upload_url)) }

        before do
          expect(create_document_service).to receive(:create).and_return(false)
        end

        it 'returns unprocessable_entity' do
          post :create, params
          expect(response).to be_unprocessable
        end

        it 'renders errors' do
          post :create, params
          response_json = JSON.parse(response.body)
          expect(response_json['errors']).to_not be_empty
        end
      end
    end
  end
end
