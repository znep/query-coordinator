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

class MissingContentTypeError < StandardError; end

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
  EXPECTED_UPLOAD_URL_FORMAT = %r{
    \A
    (
      https://#{Rails.application.secrets.aws['s3_bucket_name']}\.s3.*\.amazonaws\.com/(?<path>uploads\/.+\/(?<filename>.+))
    )|(
      https://delivery\.gettyimages\.com/.+\/.+\.(jpg|png|gif)\?.*
    )
    \z
  }x.freeze

  THUMBNAIL_SIZES = {
    small: 346,
    medium: 650,
    large: 1300,
    xlarge: 2180
  }.freeze

  enum status: { unprocessed: 0, processed: 1 }

  has_attached_file :upload,
    styles: lambda { |a| a.instance.attachment_styles_from_thumbnail_sizes },
    convert_options: {
      thumb: '-strip' # Default imagemagick quality setting is 92. See https://www.imagemagick.org/script/command-line-options.php#quality
    }

  validates :direct_upload_url, presence: true, format: { with: EXPECTED_UPLOAD_URL_FORMAT }
  validates_attachment_content_type :upload, content_type: /\A(image|text\/html)/

  before_post_process :set_content_type
  before_post_process :check_content_type_is_image

  # When requesting images from Getty Images, the Download API returns a content type of
  # application/x-download. We convert the image to its relevant MIME type here before
  # sending it off to Paperclip and S3.
  def set_content_type
    extension = File.extname(URI.parse(self.upload.url).path)[1..-1].to_s.downcase
    raise MissingContentTypeError.new if extension.blank?
    self.upload.instance_write(:content_type, Mime::Type.lookup_by_extension(extension))
  end

  # We only want to do post processing on uploaded images, not html files
  def check_content_type_is_image
    (self.upload_content_type =~ /^image/).present?
  end

  # While uploading files via the UI, the documents_controller#show endpoint returns a json version of the
  # document. When the document is finished processing, the 'id' and 'url' are stored in the block's
  # image component.
  def as_json(options=nil)
    {
      document: {
        id: self.id,
        upload_file_name: self.upload_file_name,
        upload_content_type: self.upload_content_type,
        upload_file_size: self.upload_file_size,
        status: self.status,
        created_at: self.created_at,
        url: self.upload.url(Rails.application.config.enable_responsive_images ? :xlarge : nil)
      }
    }
  end

  # Images sizes at different breakpoints in the UI.
  # When generating thumbnails, we generate 2x sizes to accomodate 2x density displays
  #
  # 12 col | 6 col | 4 col | viewport
  # -------|-------|-------|----------
  # 1090px | 532px | 346px | x-large
  # 910px  | 445px | 280px | large
  # 650px  | 317px | 207px | medium
  # 650px  | 650px | 650px | small
  def attachment_styles_from_thumbnail_sizes
    THUMBNAIL_SIZES.inject({}) { |memo, (label, pixels)| memo[label] = "#{pixels}x#{pixels}>" ; memo }
  end

end
