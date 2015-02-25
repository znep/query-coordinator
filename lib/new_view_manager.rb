# Manages creating new_view HREF views in Core

class NewViewManager

  def create(page_id, title, description)
    page_url = Rails.application.routes.url_helpers.opendata_cards_view_url(
      :id => page_id,
      :host => CurrentDomain.cname,
      :port => APP_CONFIG['ssl_port'] || 443,
      :protocol => 'https'
    )

    new_view = create_new_view(page_url, title, description)

    publish_new_view(new_view['id']) if new_view && new_view['id']

  end

  def create_new_view(page_url, title, description)
    url = '/views.json?accessType=WEBSITE'
    payload = {
      :name => title,
      :description => description,
      :flags => ['dataPublicRead'],
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
        { :url => url }
      )
    end

    parse_core_response(response)
  end

  private

  def parse_core_response(response)
    begin
      JSON.parse(response)
    rescue JSONError => e
      report_error(
        "Error parsing JSON response from Core: #{e.error_message}",
        :context => { :response => response }
      )
    end
  end

  def report_error(error_message, request = {}, context = {})
    Airbrake.notify(
      :error_class => "NewUXViewFailure",
      :error_message => error_message,
      :request => request,
      :context => context
    )
    Rails.logger.error(error_message)
    nil
  end

end
