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
    rescue CoreServer::ResourceNotFound => e
      raise ViewNotFound.new(e.message)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        raise ViewAuthenticationRequired.new(e.error_message)
      elsif e.error_code == 'permission_denied'
        raise ViewAccessDenied.new(e.error_message)
      end
      raise e
    end

    parse_core_response(response)
  end

  # This will create a new view lens that points to a cards view url of the same
  # 4x4 as itself. Note that it will not create the requisite page_metadata for
  # that url to serve anything meaningful.
  def create(title, description)
    # Create a new view pointing to nothing, since we don't have the 4x4 to
    # point it to yet.
    new_view = create_new_view('', title, description)

    unless new_view.try(:[], :id)
      raise NewViewNotCreatedError.new('Error while creating view in core')
    end

    new_page_id = new_view[:id]

    # Create the proper HREF pointing to the page with the same 4x4 as the view
    # lens, that we're going to create Real Soon Now.
    page_url = Rails.application.routes.url_helpers.opendata_cards_view_url(
      :id => new_page_id,
      :host => CurrentDomain.cname,
      :port => APP_CONFIG['ssl_port'] || 443,
      :protocol => 'https'
    )

    update_page_url(new_page_id, page_url)

    new_page_id
  end

  def delete(page_id)
    url = "/views/#{CGI::escape(page_id)}.json"

    begin
      response = CoreServer::Base.connection.delete_request(url)
    rescue CoreServer::Error => e
      report_error(
        "Error deleting new_view lens for page #{page_id}: #{e.error_message}",
        e,
        :url => url
      )
      return
    end

    parse_core_response(response)
  end

  def create_new_view(page_url, title, description)
    url = '/views.json?accessType=WEBSITE'
    payload = {
      :name => title,
      :description => description,
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
      },
      :displayType => 'new_view',
      :displayFormat => {},
      :query => {}
    }

    begin
      response = CoreServer::Base.connection.create_request(url, JSON.dump(payload))
    rescue => e
      report_error(
        "Error creating new_view lens for page: #{e.error_message}",
        e,
        { :url => url, :payload => payload },
        { :page_url => page_url }
      )
      return
    end

    parse_core_response(response)
  end

  def publish_new_view(view_id)
    url = "/views/#{view_id}/publication.json?accessType=WEBSITE"

    begin
      response = CoreServer::Base.connection.create_request(url)
    rescue
      report_error(
        "Error publishing new_view lens #{view_id}: #{e.error_message}",
        e,
        { :url => url }
      )
    end

    parse_core_response(response)
  end

  def update(page_id, title, description)
    url = "/views/#{CGI::escape(page_id)}.json"
    payload = {
      :name => title,
      :description => description,
    }

    begin
      response = CoreServer::Base.connection.update_request(url, JSON.dump(payload))
    rescue => e
      report_error(
        "Error updating new_view lens for page: #{e.error_message}",
        e,
        :url => url, :payload => payload
      )
      return
    end

    parse_core_response(response)
  end

  private

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
    rescue CoreServer::Error => e
      report_error(
        "Error updating page_url (#{page_url}) for new_view lens for page #{page_id}",
        e
      )
      return
    end

    parse_core_response(response)
  end

  def parse_core_response(response)
    begin
      JSON.parse(response).with_indifferent_access
    rescue JSON::ParserError => e
      report_error(
        "Error parsing JSON response from Core: #{e.error_message}",
        e,
        :context => { :response => response }
      )
      raise e
    end
  end

  def report_error(error_message, exception = nil, request = {}, context = {})
    Airbrake.notify(
      exception,
      :error_class => "NewUXViewFailure",
      :error_message => error_message,
      :request => request,
      :context => context
    )
    Rails.logger.error(error_message)
    nil
  end

end
