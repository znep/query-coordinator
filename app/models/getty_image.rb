require 'ConnectSDK'

class GettyImage < ActiveRecord::Base
  belongs_to :document

  validates :created_by, presence: true, format: FOUR_BY_FOUR_PATTERN
  validates :getty_id, presence: true
  validates_numericality_of :domain_id, :on => :save!, :only_integer => true

  def url
    if document.present? && document.processed?
      document.upload.url
    else
      preview_url
    end
  end

  def download!(user, story_uid)
    return if document.present?

    create_document = CreateDocument.new(user, download_parameters.merge(:story_uid => story_uid))
    document_saved = create_document.create

    unless document_saved
      raise "Failed to create a new document.\n#{create_document.document.errors.full_messages.to_sentence}"
    end

    self.document = create_document.document
    self.domain_id = CoreServer.current_domain['id']
    self.created_by = user['id']

    save!
    ProcessDocumentJob.perform_later(create_document.document.id)
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
      @preview_url = metadata['images'].try(:first).try(:[], 'display_sizes').try(:first).try(:[], 'uri')
    rescue => error
      AirbrakeNotifier.report_error(error, onmethod: 'GettyImages#preview')
      nil
    end
  end

  def download_parameters
    images_sdk = connect_sdk.images
    images_sdk.query_params['fields'] = ['download_sizes']

    metadata = images_sdk.with_ids([getty_id]).execute

    # We want to grab an image that is close to 2088 for now.
    # This is in line with the largest screen resolution that we care to support
    # for fullbleed images.
    download_metadata = metadata['images'][0]['download_sizes'].
      sort { |a, b| b['width'] <=> a['width'] }.
      detect { |image| image['width'] < 2088 }
    mime_type = download_metadata['media_type']

    download_sdk = connect_sdk.download

    {
      upload_file_name: "getty-image-#{getty_id}#{Rack::Mime::MIME_TYPES.invert[mime_type]}",
      upload_content_type: mime_type,
      upload_file_size: download_metadata['bytes'],
      direct_upload_url: download_sdk.with_id(getty_id).execute
    }
  end
end
