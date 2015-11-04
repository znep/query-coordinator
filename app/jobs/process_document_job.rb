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
  queue_as :default

  rescue_from(StandardError) do |error|
    document_id = self.arguments.first
    document = Document.find_by_id(document_id)
    story_uid = document.try(:story_uid)
    user_uid = document.try(:created_by)

    AirbrakeNotifier.report_error(error, "ProcessDocumentJob#perform(document_id: #{document_id}, story_uid: #{story_uid}, user: #{user_uid})")
    raise error
  end

  def perform(document_id)
    document = Document.find(document_id)
    document.upload = URI.parse(document.direct_upload_url)
    document.status = 'processed'
    document.save!
  end
end
