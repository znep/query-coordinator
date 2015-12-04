# == Schema Information
#
# Table name: documents
#
#  id                  :integer          not null, primary key
#  story_uid           :string           not null
#  direct_upload_url   :string           not null
#  upload_file_name    :string
#  upload_content_type :string
#  upload_file_size    :integer
#  upload_updated_at   :datetime
#  status              :integer          default(0), not null
#  created_by          :string           not null
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#
# Indexes
#
#  index_documents_on_status  (status)

class Document < ActiveRecord::Base
  validates :story_uid, presence: true
  validates :created_by, presence: true, format: FOUR_BY_FOUR_PATTERN

  # Direct upload url verifier validates whitelisted direct upload source
  #
  # @note CORS required on s3 buckets to facilitate direct upload
  #
  # @example Valid URL
  #   "https://babysloths.s3.amazonaws.com/uploads/23c887f6-02e0-40f3-a31d-c487124fa5d3/eating_a_carrot.pdf"
  #
  # @example Invalid URL
  #   "http://somewhereelse.com/malware.exe"
  #
  DIRECT_UPLOAD_URL_FORMAT = %r{
    \A
    https:\/\/
    #{Rails.application.secrets.aws['s3_bucket_name']}\.s3.*\.amazonaws\.com\/
    (?<path>uploads\/.+\/(?<filename>.+))
    \z
  }x.freeze

  enum status: { unprocessed: 0, processed: 1 }

  has_attached_file :upload

  validates :direct_upload_url, presence: true, format: { with: DIRECT_UPLOAD_URL_FORMAT }
  validates_attachment_content_type :upload, content_type: /\A(image|text\/html)/

  def as_json(options=nil)
    {
      document: {
        id: self.id,
        upload_file_name: self.upload_file_name,
        upload_content_type: self.upload_content_type,
        upload_file_size: self.upload_file_size,
        status: self.status,
        created_at: self.created_at,
        url: self.upload.url
      }
    }
  end
end
