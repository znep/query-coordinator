# encoding: utf-8 # REQUIRED to allow unicode currency symbols
class Phidippides < SocrataHttp

  include CardTypeMapping
  include DataLensMetadataHelper

  class NewPageException < RuntimeError; end
  class PageIdException < RuntimeError; end
  class NoDatasetIdException < RuntimeError; end
  class NoCardsException < RuntimeError; end
  class NoPageIdException < RuntimeError; end
  class NoDefaultDateTruncFunction < RuntimeError; end
  class NoDatasetMetadataException < RuntimeError; end
  class NoMinMaxInColumnException < RuntimeError; end
  class InvalidHostAddressException < RuntimeError; end
  class InvalidHostPortException < RuntimeError; end

  COLUMN_ID_REGEX = /(:@)?([a-z][a-z_0-9\-]*)/i
  SYSTEM_COLUMN_ID_REGEX = /:([a-z][a-z_0-9\-]*)/i
  UID_REGEXP = /\w{4}-\w{4}/
  ADDRESS_REGEXP = /^[a-z0-9\-\.]*$/i  # Not technically correct since addresses cannot end in '-' or '.'

  attr_reader :address, :port

  # Constructor accepts two parameters that specify the address and port. If not provided, it checks the
  # ENV for those values. If not found, it asks ZooKeeper for the address/port information in a single call.
  # Port is typically 2401 in development mode and 1303 in production.
  def initialize(_address = nil, _port = nil)
    if _address.present? && _port.present?
      @address = _address
      @port = _port
    elsif ENV['PHIDIPPIDES_ADDRESS'].present? && ENV['PHIDIPPIDES_PORT'].present?
      @address = ENV['PHIDIPPIDES_ADDRESS']
      @port = ENV['PHIDIPPIDES_PORT']
    else
      connection_details.tap do |connection|
        @address = connection.fetch('address')
        @port = connection.fetch('port')
      end
    end
    unless @address =~ ADDRESS_REGEXP
      raise InvalidHostAddressException.new("Invalid address: #{@address.inspect}. Must match regex: #{ADDRESS_REGEXP}")
    end
    begin
      @port = Integer(@port)
    rescue TypeError, ArgumentError
      raise InvalidHostPortException.new("Invalid port: #{@port.inspect}. Must be valid integer.")
    end
  end

  def issue_request(options)
    options[:headers] = {} unless options.has_key?(:headers)
    options[:headers]['Content-Type'] = 'application/json'
    options[:headers]['X-Socrata-Wink'] = 'iAmASocrataEmployee'

    super(options)
  end

  # Dataset Metadata requests

  # TODO Remove the initializer for the options argument -- cookies are _required_ for all requests
  def fetch_dataset_metadata(dataset_id, options = {})
    fetched_response = issue_request(
      :verb => :get,
      :path => "v1/id/#{dataset_id}/dataset",
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )

    unless fetched_response[:body].blank? || fetched_response[:status] != '200'
      augment_dataset_metadata!(dataset_id, fetched_response[:body])
    end

    fetched_response.with_indifferent_access
  end

  def update_dataset_metadata(dataset_metadata, options = {})
    issue_request(
      :verb => :put,
      :path => "v1/id/#{dataset_metadata['id']}/dataset",
      :data => dataset_metadata,
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )
  end

  def fetch_pages_for_dataset(dataset_or_id, options = {})
    dataset_id = nil

    # nil responds to :id, so we have to guard against it
    if dataset_or_id && dataset_or_id.respond_to?(:id)
      dataset_id = dataset_or_id.id
    end

    if dataset_or_id.respond_to?(:with_indifferent_access)
      dataset_id ||= dataset_or_id.with_indifferent_access[:id]
    end

    dataset_id ||= dataset_or_id

    raise ArgumentError.new('could not determine dataset id') unless dataset_id =~ UID_REGEXP

    normalize_pages_for_dataset_response!(
      exclude_non_v1_or_above_pages!(
        issue_request(
          :verb => :get,
          :path => "v1/id/#{dataset_id}/pages",
          :request_id => options[:request_id],
          :cookies => options[:cookies]
        )
      )
    )
  end

  private

  def connection_details
    zookeeper_path = ENV['ZOOKEEPER_PHIDIPPIDES_PATH'] || 'com.socrata/soda/services/phidippides'
    instance_id = ::ZookeeperDiscovery.get(zookeeper_path)

    begin
      ::ZookeeperDiscovery.get_json("/#{zookeeper_path}/#{instance_id}")
    rescue ZK::Exceptions::BadArguments => error
      error_message = "Unable to determine phidippides connection details " \
        "due to error: #{error}"
      Airbrake.notify(
        :error_class => 'ZookeeperDiscoveryError',
        :error_message => error_message
      )
      Rails.logger.error(error_message)
      raise Phidippides::ConnectionError.new(error_message)
    end
  end

end
