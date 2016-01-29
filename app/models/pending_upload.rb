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

    # Firefox appends 'charset=UTF-8' to content-type on xhr requests. We need to match that
    # tomfoolery because the presigned url we generate in #url uses the content_type to
    # generate the signature of the request. We get a SignatureMismatchError from S3
    # when we try to PUT to the presigned url with different content types.
    @content_type << '; charset=UTF-8' if @content_type == 'text/html'
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
