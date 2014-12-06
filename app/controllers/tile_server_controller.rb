# Simple proxy so the JS can access TileServer. Intended to be temporary; TileServer will be
# exposed to the 'net once some prerequisite AWS work is completed.
class TileServerController < ActionController::Base
  include ActionControllerExtensions
  include CommonSocrataMethods

  def proxy_request

    begin
      result = tileserver.fetch_tile(
        params.slice(
          :page_id,
          :field_id,
          :zoom,
          :x_coord,
          :y_coord,
          '$limit',
          '$where'
        ).merge(:cookies => forwardable_session_cookies)
      )
    rescue => error
      Rails.logger.error(error_message = "Unable to proxy TileServer due to error: #{error.to_s}")

      result = {
        status: '500',
        body: {
          error: true,
          reason: 'Error accessing TileServer',
          details: error.to_s
        }
      }
    end

    if result[:status] == '200'
      send_data(
        result[:body],
        :type => result[:content_type]
      )
    else
      render result.update(:json => result[:body])
    end

  end

  private

  def tileserver
    @tileserver ||= TileServer.new
  end

end
