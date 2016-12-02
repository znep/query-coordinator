##
# CreateDocumentFromCoreAsset parses a core asset URL and
# builds a Storyteller document which will kick off an
# upload of the core asset to our S3 and provide thumbnails
# for it.
class CreateDocumentFromCoreAsset

  attr_reader :document

  # @example
  #   service = CreateDocumentFromCoreAsset.new(asset_id, story_uid, user_id)
  #   service.create
  #
  # @param asset_id [String]
  # @param story_uid [String]
  # @param user_id [Hash]
  def initialize(asset_id, story_uid, user_id)
    asset_response = CoreServer.get_asset(asset_id)

    @document = Document.new(
      :upload_file_size => asset_response.raw.header['Content-Length'],
      :upload_file_name => asset_id,
      :upload_content_type => asset_response.raw.header['Content-Type'],
      :direct_upload_url => "#{CoreServer.coreservice_uri}/assets/#{asset_id}",
      :created_by => user_id,
      :story_uid => story_uid,
      :skip_thumbnail_generation => true
    )
  end

  # @return [Boolean] Document saved
  def create
    saved = @document.save
    queue_process if saved
    saved
  end

  private

  def queue_process
    # Immediately process the image and defer the
    # thumbnail creation to get the user through the migration
    # finish line faster, and to prevent asynchronicity race
    # conditions between creating the document and creating the
    # document's thumbnails.
    ProcessDocumentJob.perform_now(@document.id)
    RegenerateSkippedThumbnailsJob.perform_later(@document.id)
  end

end
