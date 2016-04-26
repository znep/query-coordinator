require "ConnectSdk"

class GettyImage < ActiveRecord::Base
  belongs_to :document

  validates :created_by, presence: true, format: FOUR_BY_FOUR_PATTERN

  def url
    if document.present? && document.processed?
      document.upload.url
    else
      preview_url
    end
  end

  def download(user, story_uid)
    return if document.present?

    create_document = CreateDocument.new(user, download_parameters.merge(:story_uid => story_uid))
    document_saved = create_document.create

    unless document_saved
      raise "Failed to create a new document.\n#{create_document.document.errors.full_messages.to_sentence}"
    end

    self.document = create_document.document
    self.domain_id = CoreServer.current_domain['id']
    self.created_by = user['id']

    if save!
      ProcessDocumentJob.perform_later(create_document.document.id)
    else
      raise 'GettyImage failed to persist to the database.'
    end
  end

  private

  def connect_sdk
    @connect_sdk ||= ConnectSdk.new(
      Rails.application.secrets.getty['api_key'],
      Rails.application.secrets.getty['api_secret']
    )
  end

  def preview_url
    return @preview_url if @preview_url.present?

    images_sdk = connect_sdk.images
    images_sdk.query_params['fields'] = ['comp']

    begin
      metadata = images_sdk.with_ids([getty_id]).execute
      @preview_url = metadata['images'][0]['display_sizes'][0]['uri']
    rescue => error
      nil
    end
  end

  def download_parameters
    params = {}
    images_sdk = connect_sdk.images
    images_sdk.query_params['fields'] = ['download_sizes']

    metadata = images_sdk.with_ids([getty_id]).execute
    download_metadata = metadata['images'][0]['download_sizes'].
      sort { |a, b| b['width'] <=> a['width'] }.
      detect { |image| image['width'] < 2088 }
    mime_type = download_metadata['media_type']

    download_sdk = connect_sdk.download
    # download_sdk.query_params['height'] = download_metadata['height']

    params[:upload_file_name] = "getty-image-#{getty_id}#{Rack::Mime::MIME_TYPES.invert[mime_type]}"
    params[:upload_content_type] = mime_type
    params[:upload_file_size] = download_metadata['bytes']
    params[:direct_upload_url] = download_sdk.with_id(getty_id).execute

    params
  end
end
