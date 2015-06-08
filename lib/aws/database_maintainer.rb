require 'rake'
require 'httparty'
require 'aws-sdk-core'
require 'aws-sdk-resources'
require 'yaml'
require 'base64'

module Aws
  class DatabaseMaintainer
    # Acceptable AWS environments
    KNOWN_ENVS = %w( staging rc prod )
    KNOWN_REGIONS = %w( us-west-2 )
    RAILS_ENV_FOR_MIGRATIONS = 'aws_migrations'

    # Initializes lots of things for running db tasks against AWS. Dynamically
    # loads config from marathon and clortho for the specified environment.
    #
    # Running methods in this class presume a few things:
    #   * You have an admin account in AWS and those credentials are stored in ~/.aws/credentials
    #   * You have a database.yml with config called 'aws_migrations (See database.yml.sample).
    #
    # @param args [string] :environment AWS environment
    # @param args [string] :region AWS region
    def initialize(args)
      @environment = args[:environment]
      @region = args[:region]

      Rails.env = RAILS_ENV_FOR_MIGRATIONS

      validate_args
      update_aws_config
      set_environment_vars_from_marathon_config
      set_secret_db_password
    end

    # This script will attempt to run database migrations in a particular environment
    def migrate
      rake['db:migrate'].invoke
    end

    # This script will attempt to rollback database migrations in a particular environment
    def rollback
      rake['db:rollback'].invoke
    end

    # This script will attempt to seed the database in a particular environment.
    def seed
      rake['db:seed'].invoke
    end

    private
    attr_reader :environment, :region

    def validate_args
      unless KNOWN_ENVS.include?(environment)
        raise ArgumentError.new("ENVIRONMENT not valid. Expected one of [#{KNOWN_ENVS.join(', ')}].")
      end

      unless KNOWN_REGIONS.include?(region)
        raise ArgumentError.new("AWS_REGION not valid. Expected one of [#{KNOWN_REGIONS.join(', ')}].")
      end
    end

    def update_aws_config
      Aws.config[:region] = region
      Aws.config[:profile] = environment
    end

    def set_environment_vars_from_marathon_config
      response = HTTParty.get(marathon_config_url, timeout: 5)

      unless response && response['app'] && response['app']['env']
        raise 'Could not get environment config from marathon.'
      end

      config = response['app']['env']

      %w(
        PG_DB_HOST
        PG_DB_NAME
        PG_DB_PORT
        PG_DB_USER
        CLORTHO_BUCKET
        CLORTHO_PATH
      ).each do |config_key|
        value = config[config_key]
        raise "Could not set #{config_key}." unless value
        ENV[config_key] = config[config_key]
      end
    end

    def marathon_config_url
      # Pull config from marathon for the storyteller app
      "http://marathon.aws-us-west-2-#{environment}.socrata.net/v2/apps/#{environment}/storyteller"
    end

    def rake
      Rake.application
    end

    # Get DB password from aws-kms store, CLORTHO-GET-style
    # This code was lifted from https://github.com/socrata/shipyard/blob/master/base/clortho-get
    def set_secret_db_password
      ENV['PG_DB_PASSWORD'] = decrypted_db_password
    end

    def decrypted_db_password
      $1 if decrypted_secret_file =~ /PG_DB_PASSWORD=(.+)\n/
    end

    def decrypted_secret_file
      s3c = Aws::S3::Encryption::Client.new(encryption_key: data_key)
      res = s3c.get_object(bucket: ENV['CLORTHO_BUCKET'],
                           key: ENV['CLORTHO_PATH'])

      res[:body].read
    end

    def data_key
      key_file = "#{ENV['CLORTHO_PATH']}.key"
      s3c = Aws::S3::Client.new
      res = s3c.get_object(bucket: ENV['CLORTHO_BUCKET'],
                           key: key_file)
      key_blob_strio = res[:body]
      key_blob = key_blob_strio.read
      decrypt_data_key(key_blob)
    end

    def decrypt_data_key(blob)
      kms = Aws::KMS::Client.new
      res = kms.decrypt(ciphertext_blob: blob)
      res[:plaintext]
    end

  end
end
