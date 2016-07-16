# Endpoint to create a Document object and attach an uploaded file
# after uploading that file via the URL generated with the UploadsController#create
# endpoint.
class Api::V1::DocumentsController < ApplicationController
  force_ssl

  # NOTE Not happy with this, but gets us working again until we can rev the api to make documents
  # children of stories, which technically, they already are.
  skip_before_filter :set_story_uid
  prepend_before_filter :save_story_uid, only: [:create]
  prepend_before_filter :save_story_uid_from_document, only: [:show, :crop]

  def show
    render json: document
  end

  def create
    create_document_service = if params.dig(:document, :getty_image_id)
      CreateDocumentFromGettyImage.new(current_user, getty_image_document_params)
    else
      CreateDocument.new(current_user, document_params)
    end

    document = create_document_service.document

    if create_document_service.create
      render json: document, status: :created
    else
      render json: { errors: document.errors.messages }, status: :unprocessable_entity
    end
  end

  def crop
    if document.update_attributes(crop_params)
      document.regenerate_thumbnails!
      render nothing: true, status: :ok
    else
      render json: { errors: document.errors.messages }, status: :unprocessable_entity
    end
  end

  private

  def document
    @document ||= Document.find(params[:id])
  end

  def save_story_uid
    ::RequestStore.store[:story_uid] = params.dig('document', 'story_uid')
  end

  def save_story_uid_from_document
    ::RequestStore.store[:story_uid] = document.try(:story_uid)
  end

  def document_params
    params.require(:document).permit(
      :story_uid, :direct_upload_url, :upload_content_type, :upload_file_name, :upload_file_size,
      :crop_x, :crop_y, :crop_width, :crop_height
    )
  end

  def getty_image_document_params
    params.require(:document).permit(
      :story_uid, :getty_image_id, :crop_x, :crop_y, :crop_width, :crop_height
    )
  end

  def crop_params
    params.require(:document).permit(:crop_x, :crop_y, :crop_width, :crop_height)
  end
end
