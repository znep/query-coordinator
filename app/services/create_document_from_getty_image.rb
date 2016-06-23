# Handles async Document create and processing workflow
class CreateDocumentFromGettyImage

  attr_reader :document

  # @example
  #   create_document_service = CreateDocumentFromGettyImage.new(user, getty_image_id)
  #   create_document_service.create
  #
  # @param user [Hash]
  # @param params [Hash]
  def initialize(user, params)
    user ||= {}
    params ||= {}

    if user['id'].blank?
      raise ArgumentError.new('User is not valid')
    end
    if params[:getty_image_id].blank?
      raise ArgumentError.new('Getty Image ID cannot be blank')
    end
    if params[:story_uid].blank?
      raise ArgumentError.new('Story UID cannot be blank')
    end

    @getty_image = GettyImage.find_or_initialize_by(getty_id: params[:getty_image_id])

    # If we are seeing this Getty image for the first time, we're going to download it below without
    # generating thumbnails (for SPEED). But after we create the new Document, we can queue up
    # regenerating those thumbnails.
    @getty_image_will_need_thumbnails = @getty_image.document.nil?

    @getty_image.download!(user, params[:story_uid], process_immediately: true, skip_thumbnail_generation: true)
    @getty_image.reload

    document_params = @getty_image.document.attributes.with_indifferent_access.
        slice(:upload_file_size, :upload_file_name, :upload_content_type)
    document_params.merge!(params.slice(:story_uid, :crop_x, :crop_y, :crop_width, :crop_height))
    document_params['direct_upload_url'] = @getty_image.document.canonical_url(:original)
    document_params['created_by'] = user['id']

    @document = Document.new(document_params)
  end

  # @return [Boolean] Document saved
  def create
    saved = @document.save
    queue_process if saved
    saved
  end

  private

  def queue_process
    ProcessDocumentJob.perform_later(@document.id)

    # since we skip thumbnail generation above for the getty image, queue it up to process later
    if @getty_image_will_need_thumbnails
      RegenerateSkippedThumbnailsJob.perform_later(@getty_image.document.id)
    end
  end

end
