# Model containing properties that are used to upload a file to a specific location.
# Generates a signed URL for uploading to S3.
class PendingUpload
  attr_accessor :filename, :content_type

  include ActiveModel::Serialization

  # @note It is important to have a single source of truth (Rails) for content-type, as
  #   clients may return mismatched content-types versus what Rails deduces, resulting in s3 signature errors.
  #
  # @param filename [String]
  #
  def initialize(filename)
    @filename = filename
    @content_type = MIME::Types.type_for(filename).first.content_type
  end

  def url
    @url ||= begin
      s3_obj = AWS::S3.new.
        buckets[Rails.application.secrets.aws['s3_bucket_name']].
        objects["uploads/#{SecureRandom.uuid}/#{filename}"]

      s3_obj.url_for(:write, content_type: @content_type, acl: :public_read)
    end
  end

  def as_json(options = nil)
    {
      upload: {
        url: url.to_s,
        content_type: content_type
      }
    }
  end
end
