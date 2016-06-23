require 'rails_helper'

RSpec.describe Api::V1::DocumentsController, type: :controller do

  before do
    request.env['HTTPS'] = 'on'
  end

  describe '#create' do

    let(:create_document_service) { double('create_document_service').as_null_object }
    let(:direct_upload_url) { "https://#{Rails.application.secrets.aws['s3_bucket_name']}.s3.amazonaws.com/uploads/random/#{upload_file_name}" }
    let(:upload_content_type) { 'image/jpeg' }
    let(:upload_file_name) { 'thefilename.jpg' }
    let(:upload_file_size) { '3884732' }
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

      it 'renders unauthorized' do
        post :create, params
        expect(response.status).to eq(403)
      end
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      describe 'user story authorizations' do
        before do
          allow_any_instance_of(ApplicationController).to receive(:can_edit_story?).and_return(can_edit_story)
        end

        describe 'when the user can edit the story' do
          let(:can_edit_story) { true }

          it 'does not 403' do
            post :create, params
            expect(response.status).to_not be(403)
          end
        end

        describe 'when the user cannot edit the story' do
          let(:can_edit_story) { false }

          it '403s' do
            post :create, params
            expect(response.status).to be(403)
          end
        end
      end

      it 'initializes correct service object with params' do
        expect(CreateDocument).to receive(:new).with(mock_valid_user, params[:document].stringify_keys)
        expect(CreateDocumentFromGettyImage).to_not receive(:new)
        post :create, params
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

      context 'when params include cropping values' do
        let(:params) do
          {
            document: {
              story_uid: story_uid,
              direct_upload_url: direct_upload_url,
              upload_content_type: upload_content_type,
              upload_file_name: upload_file_name,
              upload_file_size: upload_file_size,
              crop_x: '0',
              crop_y: '0',
              crop_width: '1',
              crop_height: '0.5'
            }
          }
        end

        it 'passes cropping params to service object' do
          expect(CreateDocument).to receive(:new).with(mock_valid_user, params[:document].stringify_keys)
          post :create, params
        end
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

      context 'when params includes getty_image_id' do
        let(:getty_image_id) { 'abc12345' }
        let(:getty_image_document_params) do
          {
            document: {
              story_uid: story_uid,
              getty_image_id: getty_image_id
            }
          }
        end

        before do
          allow(CreateDocumentFromGettyImage).to receive(:new).and_return(create_document_service)
        end

        it 'initializes correct service object with params' do
          expect(CreateDocument).to_not receive(:new)
          expect(CreateDocumentFromGettyImage).to receive(:new).with(mock_valid_user, getty_image_document_params[:document].stringify_keys)
          post :create, getty_image_document_params
        end

        context 'when CreateDocumentFromGettyImage service fails' do
          let(:document) { Document.create(params[:document].except(:direct_upload_url)) }

          before do
            expect(create_document_service).to receive(:create).and_return(false)
          end

          it 'returns unprocessable_entity' do
            post :create, getty_image_document_params
            expect(response).to be_unprocessable
          end

          it 'renders errors' do
            post :create, getty_image_document_params
            response_json = JSON.parse(response.body)
            expect(response_json['errors']).to_not be_empty
          end
        end

        context 'when params include cropping values' do
          let(:getty_image_document_params) do
            {
              document: {
                story_uid: story_uid,
                getty_image_id: getty_image_id,
                crop_x: '0',
                crop_y: '0',
                crop_width: '1',
                crop_height: '0.5'
              }
            }
          end

          it 'passes cropping params to service object' do
            expect(CreateDocumentFromGettyImage).to receive(:new).with(mock_valid_user, getty_image_document_params[:document].stringify_keys)
            post :create, getty_image_document_params
          end
        end
      end
    end
  end

  describe '#show' do
    let!(:document) { FactoryGirl.create(:document) }

    context 'when not authenticated' do
      before do
        stub_invalid_session
      end

      it 'redirects' do
        get :show, id: document
        expect(response).to be_redirect
      end
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      it 'is success' do
        get :show, id: document
        expect(response).to be_success
      end

      it 'renders document' do
        get :show, id: document
        json_response = JSON.parse(response.body)
        expect(json_response['document']).to_not be_empty
      end
    end
  end

  describe '#crop' do
    let!(:document) { FactoryGirl.create(:document) }

    context 'when not authenticated' do
      before do
        stub_invalid_session
      end

      it 'renders unauthorized' do
        post :crop, id: document
        expect(response.status).to eq(403)
      end
    end

    context 'when authenticated' do
      let(:document_params) do
        {
          crop_x: 0.345,
          crop_y: 0.0399372,
          crop_width: 0.834,
          crop_height: 1.0
        }
      end

      before do
        allow_any_instance_of(Document).to receive(:regenerate_thumbnails!)
        stub_valid_session
      end

      describe 'user story authorizations' do
        before do
          allow_any_instance_of(ApplicationController).to receive(:can_edit_story?).and_return(can_edit_story)
        end

        describe 'when the user can edit the story' do
          let(:can_edit_story) { true }

          it 'does not 403' do
            post :crop, id: document.id, document: document_params
            expect(response.status).to_not be(403)
          end
        end

        describe 'when the user cannot edit the story' do
          let(:can_edit_story) { false }

          it '403s' do
            post :crop, id: document.id, document: document_params
            expect(response.status).to be(403)
          end
        end
      end

      it 'is success' do
        post :crop, id: document.id, document: document_params
        expect(response).to be_success
      end

      it 'regenerates thumbnails' do
        expect(Document).to receive(:find).with(document.id.to_s).and_return(document)
        expect(document).to receive(:regenerate_thumbnails!)
        post :crop, id: document.id, document: document_params
      end

      context 'when document params are invalid' do
        let(:document_params) do
          {
            crop_x: 0,
            crop_y: nil,
            crop_width: 1,
            crop_height: 1
          }
        end

        it 'returns unprocessable entity' do
          post :crop, id: document.id, document: document_params
          expect(response).to be_unprocessable
        end

        it 'does not generate thumbnails' do
          expect(Document).to receive(:find).with(document.id.to_s).and_return(document)
          expect(document).to_not receive(:regenerate_thumbnails!)
          post :crop, id: document.id, document: document_params
        end

        it 'returns error messages' do
          post :crop, id: document.id, document: document_params
          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to_not be_empty
        end
      end
    end
  end
end
