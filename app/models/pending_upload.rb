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

    mime_type = MIME::Types.type_for(filename).first

    raise UnsupportedFileTypeError.new('File type is unsupported.') unless mime_type.present?

    @content_type = mime_type.content_type

    # Firefox appends 'charset=UTF-8' to content-type on xhr requests. We need to match that
    # tomfoolery because the presigned url we generate in #url uses the content_type to
    # generate the signature of the request. We get a SignatureMismatchError from S3
    # when we try to PUT to the presigned url with different content types.
    @content_type << '; charset=UTF-8' if @content_type == 'text/html'
  end

  def url
    @url ||= begin
      s3_obj = Aws::S3::Bucket.new(Rails.application.secrets.aws['s3_bucket_name']).
        object("uploads/#{SecureRandom.uuid}/#{filename}")

      s3_obj.presigned_url(
        :put,
        content_type: @content_type,
        acl: 'public-read',
        server_side_encryption: 'AES256'
      )
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

class UnsupportedFileTypeError < StandardError
end
