# Final upload processing step:
#
# 1) Set upload source to direct_upload_url, which instantiates download, process, re-upload to final path
# 2) Set status to processed
#
# @note Temporary uploads in /uploads are purged by AWS S3 Lifecycle cleaning.
# @see http://docs.aws.amazon.com/AmazonS3/latest/dev/object-lifecycle-mgmt.html
# @see http://docs.aws.amazon.com/AmazonS3/latest/dev/CopyingObjectUsingRuby.html
#
# @note 'save!' required to cancel save on failed validations
class ProcessDocumentJob < ActiveJob::Base
  queue_as :documents

  rescue_from(StandardError) do |error|
    document_id = self.arguments.first
    document = Document.find(document_id)
    story_uid = document.try(:story_uid)
    user_uid = document.try(:created_by)

    document.status = 'error'
    # We don't use a save! because we don't wait to
    # raise here. So don't put one! The JS has a timeout
    # that will stop the pinging process in the case where
    # we can't set status (after some *really* long time).
    document.save

    AirbrakeNotifier.report_error(
      error,
      on_method: "ProcessDocumentJob#perform(document_id: #{document_id}, story_uid: #{story_uid}, user: #{user_uid})"
    )
    raise error
  end

  def perform(document_id)
    document = Document.find(document_id)

    # X-Socrata-Host is required for create_document_from_core_asset
    # We knowingly over-assign it here for other document types because it'll
    # be innocuous to other services (like S3 and others).
    #
    # dontuse.ly exists in all environments as the base domain.
    document.upload = open(document.direct_upload_url, "X-Socrata-Host" => 'dontuse.ly')

    document.status = 'processed'
    document.save!
  end
end
