# Manages creating new_view HREF views in Core

class NewViewManager
  class Error < RuntimeError; end
  class NewViewNotCreatedError < Error; end
  class ViewNotFound < Error; end
  class ViewAuthenticationRequired < Error; end
  class ViewAccessDenied < Error; end
  class InvalidPermissions < Error; end

  # TODO: consolidate this with the 'dataset' parameter in phidippides_datasets_controller, which
  # fetches the same url
  def fetch(page_id)
    url = "/views/#{CGI::escape(page_id)}.json"

    begin
      response = CoreServer::Base.connection.get_request(url)
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
  def create(page_metadata={}, category=nil, v2_data_lens=false)
    page_metadata = ActiveSupport::HashWithIndifferentAccess.new(page_metadata)
    new_view = v2_data_lens ?
      create_v2_data_lens_in_metadb(page_metadata, category) :
      create_v1_data_lens_in_phidippides(page_metadata, category)

    unless new_view.try(:[], :id)
      raise NewViewNotCreatedError.new('Error while creating view in core')
    end

    new_page_id = new_view[:id]

    # Create the proper HREF pointing to the page with the same 4x4 as the view
    # lens, that we're going to create Real Soon Now.
    page_url = Rails.application.routes.url_helpers.opendata_cards_view_url(
      :id => new_page_id,
      :host => CurrentDomain.cname,
      :port => APP_CONFIG.ssl_port,
      :protocol => 'https'
    )

    update_page_url(new_page_id, page_url)

    begin
      View.find(new_page_id).publish
    rescue CoreServer::ResourceNotFound => error
      report_error(
        "Failed to mark bootstrapped page as published. Core responded with 404 for new_page_id: #{new_page_id}"
      )
    rescue CoreServer::Error => error
      report_error(
        "Failed to mark bootstrapped page as published. Unhandled Core exception: #{error.inspect}"
      )
    end

    new_page_id
  end

  def delete(page_id)
    url = "/views/#{CGI::escape(page_id)}.json"

    begin
      response = CoreServer::Base.connection.delete_request(url)
    rescue CoreServer::Error, CoreServer::ResourceNotFound => error

      report_error(
        "Error deleting new_view lens for page #{page_id}: #{error}",
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
        "Error updating new_view lens for page: #{error}",
        error,
        :url => url,
        :payload => payload
      )
      return
    end

    parse_core_response(response)
  end

  private

  # Creates metadata in MetaDB with page metadata, rather than in Phidippides.
  def create_v2_data_lens_in_metadb(page_metadata, category)
    # NOTE: Category is not validated. If category is not present in the
    # domain's defined categories, the category will be ignored by core.
    url = '/views.json?accessType=WEBSITE'
    payload = {
      :name => page_metadata[:name],
      :description => page_metadata[:description],
      :metadata => {
        :renderTypeConfig => {
          :visible => {
            :href => true
          }
        },
        :accessPoints => {
          :new_view => ''
        },
        :availableDisplayTypes => ['data_lens'],
        :jsonQuery => {}
      },
      :displayType => 'data_lens',
      :displayFormat => {
        :data_lens_page_metadata => {
          :name => page_metadata[:name],
          :description => page_metadata[:description],
          :cards => page_metadata[:cards],
          :pageId => '',
          :datasetId => page_metadata[:datasetId],
          :defaultDateTruncFunction => page_metadata[:defaultDateTruncFunction],
          :version => 2
        }
      },
      :query => {},
      :category => category
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

    payload_with_id = parse_core_response(response)
    new_page_id = payload_with_id[:id]
    payload_with_id[:displayFormat][:data_lens_page_metadata][:pageId] = new_page_id

    update(new_page_id, payload_with_id)
  end

  # v1 data lens, where the page metadata will be stored in Phidippides
  def create_v1_data_lens_in_phidippides(page_metadata, category)
    # NOTE: Category is not validated. If category is not present in the
    # domain's defined categories, the category will be ignored by core.
    url = '/views.json?accessType=WEBSITE'
    payload = {
      :name => page_metadata[:name],
      :description => page_metadata[:description],
      :metadata => {
        :renderTypeConfig => {
          :visible => {
            :href => true
          }
        },
        :accessPoints => {
          :new_view => ''
        },
        :availableDisplayTypes => ['new_view'],
        :jsonQuery => {}
      },
      :displayType => 'new_view',
      :displayFormat => {},
      :query => {},
      :category => category
    }

    begin
      response = CoreServer::Base.connection.create_request(url, JSON.dump(payload))
    rescue CoreServer::Error => error
      report_error(
        "Error creating new_view lens for page: #{error}",
        error,
        :url => url,
        :payload => payload,
        :page_url => ''
      )
    end

    parse_core_response(response)
  end

  def update_page_url(page_id, page_url)
    url = "/views/#{CGI::escape(page_id)}.json"
    payload = {
      :metadata => {
        :renderTypeConfig => {
          :visible => {
            :href => true
          }
        },
        :accessPoints => {
          :new_view => page_url
        },
        :availableDisplayTypes => ['new_view'],
        :jsonQuery => {}
      }
    }

    begin
      response = CoreServer::Base.connection.update_request(url, JSON.dump(payload))
    rescue CoreServer::Error => error
      report_error(
        "Error updating page_url (#{page_url}) for new_view lens for page #{page_id}",
        error
      )
      return
    end

    parse_core_response(response)
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
