# Manages creation, deletion, and fetching of data lens views in Core

class DataLensManager
  class Error < RuntimeError; end
  class DataLensNotCreatedError < Error; end
  class ViewNotFound < Error; end
  class ViewAuthenticationRequired < Error; end
  class ViewAccessDenied < Error; end
  class InvalidPermissions < Error; end

  # TODO: consolidate this with the 'dataset' parameter in dataset_metadata_controller, which
  # fetches the same url
  def fetch(page_id)
    url = "/views/#{CGI::escape(page_id)}.json"

    begin
      response = CoreServer::Base.connection.get_request(
        url,
        View.federation_headers
      )
    rescue CoreServer::ResourceNotFound => error
      raise ViewNotFound.new(error.to_s)
    rescue CoreServer::CoreServerError => error
      if error.respond_to?(:error_code)
        if error.error_code == 'authentication_required'
          raise ViewAuthenticationRequired.new(error)
        elsif error.error_code == 'permission_denied'
          raise ViewAccessDenied.new(error)
        end
      end

      raise error
    end

    parse_core_response(response)
  end

  # This will create a new view lens that points to a cards view url of the same
  # 4x4 as itself. Note that it will not create the requisite page_metadata for
  # that url to serve anything meaningful.
  def create(category=nil, page_metadata={})
    data_lens = persist_data_lens(category, page_metadata)

    unless data_lens.try(:[], :id)
      raise DataLensNotCreatedError.new('Error while creating view in core')
    end

    data_lens_id = data_lens[:id]

    # Create the proper HREF pointing to the page with the same 4x4 as the view
    # lens, that we're going to create Real Soon Now.
    page_url = Rails.application.routes.url_helpers.opendata_cards_view_url(
      :id => data_lens_id,
      :host => CurrentDomain.cname,
      :port => APP_CONFIG.ssl_port,
      :protocol => 'https'
    )

    data_lens_id
  end

  def delete(page_id)
    url = "/views/#{CGI::escape(page_id)}.json"

    begin
      response = CoreServer::Base.connection.delete_request(url)
    rescue CoreServer::Error, CoreServer::ResourceNotFound => error

      report_error(
        "Error deleting data lens with uid #{page_id}: #{error}",
        error,
        :url => url
      )
      return
    end

    parse_core_response(response)
  end

  def update(page_id, payload = {})
    url = "/views/#{CGI::escape(page_id)}.json"

    begin
      response = CoreServer::Base.connection.update_request(url, JSON.dump(payload))
    rescue CoreServer::Error, CoreServer::ResourceNotFound => error
      report_error(
        "Error updating data lens with uid #{page_id}: #{error}",
        error,
        :url => url,
        :payload => payload
      )
      return
    end

    parse_core_response(response)
  end

  private

  # Saves page metadata.
  def persist_data_lens(category, page_metadata)
    # NOTE: Category is not validated. If category is not present in the
    # domain's defined categories, core _will_ allow this invalid category
    # to be persisted.
    url = '/views.json?accessType=WEBSITE'
    payload = {
      :name => page_metadata[:name],
      :description => page_metadata[:description],
      :metadata => {
        :availableDisplayTypes => ['data_lens'],
        :jsonQuery => {}
      },
      :displayType => 'data_lens',
      :displayFormat => {
        :data_lens_page_metadata => page_metadata.reject { |key, _|
          PageMetadataManager.keys_to_skip.include?(key)
        }
      },
      :query => {},
      :flags => ['default'],
      :id => page_metadata['datasetId'],
      :originalViewId => page_metadata['datasetId'],
      :category => category,
      :provenance => page_metadata['provenance'] ||= 'community'
    }

    begin
      response = CoreServer::Base.connection.create_request(url, JSON.dump(payload))
    rescue CoreServer::Error => error
      report_error(
        "Error creating data_lens for page: #{error}",
        error,
        :url => url,
        :payload => payload,
        :page_url => ''
      )
    end

    # Update metadata with page id
    payload_with_id = parse_core_response(response)
    new_page_id = payload_with_id[:id]
    payload_with_id[:displayFormat][:data_lens_page_metadata][:pageId] = new_page_id

    if page_metadata.key?(:hideFromCatalog)
      payload_with_id[:hideFromCatalog] = page_metadata[:hideFromCatalog]
    end
    if page_metadata.key?(:hideFromDataJson)
      payload_with_id[:hideFromDataJson] = page_metadata[:hideFromDataJson]
    end

    update(new_page_id, payload_with_id)
  end

  def parse_core_response(response)
    begin
      JSON.parse(response).with_indifferent_access
    rescue JSON::ParserError => error
      report_error(
        "Error parsing JSON response from Core: #{error}",
        error,
        :response => response
      )
      raise error
    end
  end

  def report_error(error_message, exception = nil, options = {})
    Airbrake.notify(
      exception,
      options.merge(
        :error_class => 'NewUXViewFailure',
        :error_message => error_message
      )
    )
    Rails.logger.error(error_message)
    nil
  end

end
