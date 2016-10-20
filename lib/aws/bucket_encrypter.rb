module Aws
  class BucketEncrypter
    # Acceptable AWS environments
    KNOWN_ENVS = %w( staging rc prod fedramp-prod eu-west-1-prod )
    KNOWN_REGIONS = %w( us-west-2 us-east-1 eu-west-1 )

    # Running methods in this class presumes you have an admin account in AWS and
    # those credentials are stored in ~/.aws/credentials
    #
    # @param args [string] :bucket AWS S3 bucket name
    # @param args [string] :environment AWS environment
    # @param args [string] :region AWS region
    def initialize(args)
      @bucket = args[:bucket]
      @environment = args[:environment]
      @region = args[:region]

      validate_args
      update_aws_config
    end

    # This method will copy all files in-place within an s3 bucket and set
    # server-side encryption to AES256
    def encrypt
      # Docs for this command found at https://docs.aws.amazon.com/cli/latest/reference/s3/cp.html
      system("aws s3 cp --region #{region} --profile #{environment} --recursive --sse s3://#{bucket} s3://#{bucket}")

      raise "Command failed with exit status #{$?.exitstatus}" unless $?.exitstatus.zero?
    end

    private
    attr_reader :bucket, :region, :environment

    def validate_args
      unless KNOWN_ENVS.include?(environment)
        raise ArgumentError.new("ENVIRONMENT not valid. Expected one of [#{KNOWN_ENVS.join(', ')}].")
      end

      unless KNOWN_REGIONS.include?(region)
        raise ArgumentError.new("AWS_REGION not valid. Expected one of [#{KNOWN_REGIONS.join(', ')}].")
      end
    end

    def update_aws_config
      # If we have ENV vars set for the storyteller app config for file uploads, it conflicts with the AWS
      # credentials used for the clortho bucket.
      ENV.delete('AWS_S3_BUCKET_NAME')
      ENV.delete('AWS_ACCESS_KEY_ID')
      ENV.delete('AWS_SECRET_KEY')

      Aws.config[:region] = region
      Aws.config[:profile] = environment
    end
  end
end
