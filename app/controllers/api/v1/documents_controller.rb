# Endpoint to create a Document object and attach an uploaded file
# after uploading that file via the URL generated with the UploadsController#create
# endpoint.
class Api::V1::DocumentsController < ApplicationController

  def show
    document = Document.find(params[:id])
    render json: document
  end

  def create
    create_document_service = CreateDocument.new(current_user, document_params)
    document = create_document_service.document

    if create_document_service.create
      render json: document, status: :created
    else
      render json: { errors: document.errors.messages }, status: :unprocessable_entity
    end
  end

  private

  def document_params
    params.require(:document).permit(:story_uid, :direct_upload_url, :upload_content_type, :upload_file_name, :upload_file_size)
  end
end
