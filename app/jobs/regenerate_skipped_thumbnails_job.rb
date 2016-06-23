# @note 'save!' required to cancel save on failed validations
class RegenerateSkippedThumbnailsJob < ActiveJob::Base
  queue_as :thumbnails

  rescue_from(StandardError) do |error|
    document_id = self.arguments.first
    document = Document.find_by_id(document_id)
    story_uid = document.try(:story_uid)
    user_uid = document.try(:created_by)

    AirbrakeNotifier.report_error(
      error,
      on_method: "RegenerateSkippedThumbnailsJob#perform(document_id: #{document_id}, story_uid: #{story_uid}, user: #{user_uid})"
    )
    raise error
  end

  def perform(document_id)
    document = Document.find(document_id)
    return unless document.skip_thumbnail_generation

    document.skip_thumbnail_generation = nil
    document.regenerate_thumbnails!
    document.status = 'processed'
    document.save!
  end
end
