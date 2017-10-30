class VisualizationCanvasController < ApplicationController
  include ApplicationHelper

  def create
    begin
      body = parse_body
    rescue
      return render :status => :bad_request
    end

    payload = {
      :name => body['view']['name'],
      :description => body['view']['description'],
      :displayFormat => serialize_display_format(body),
      :displayType => 'visualization',
      :metadata => {
        :availableDisplayTypes => ['visualization']
      },
      :originalViewId => body['parentView']['id']
    }

    begin
      url = '/views.json?accessType=WEBSITE'
      response = JSON.parse(CoreServer::Base.connection.create_request(url, JSON.dump(payload)))
    rescue CoreServer::Error, JSON::ParserError => error
      report_error(error, url, payload)
      return render :json => error, :status => :internal_server_error
    end

    render :json => response
  end

  def update
    begin
      body = parse_body
    rescue
      return render :status => :bad_request
    end

    id = params[:id]

    payload = {
      :name => body['view']['name'],
      :description => body['view']['description'],
      :displayFormat => serialize_display_format(body)
    }

    begin
      url = "/views/#{id}.json?accessType=WEBSITE"
      response = JSON.parse(CoreServer::Base.connection.update_request(url, JSON.dump(payload)))
    rescue CoreServer::Error, JSON::ParserError => error
      report_error(error, url, payload)
      return render :json => error, :status => :internal_server_error
    end

    render :json => response
  end

  private

  # Errors raised here will result in a 400 sent to the client
  def parse_body
    body = JSON.parse(request.body.read)
    raise ArgumentError unless body.has_key?('view') && body.has_key?('parentView')
    body
  end

  def serialize_display_format(body)
    {
      :visualizationCanvasMetadata => {
        :version => 1,
        :vifs => body['vifs'],
        :filters => body['filters']
      }
    }
  end

  def report_error(error, url, payload)
    message = "Error saving visualization canvas: #{error}"

    Rails.logger.error(message)
    Airbrake.notify(error, {
      :error_class => 'VisualizationCanvasError',
      :error_message => message,
      :url => url,
      :payload => payload
    })
  end
end
