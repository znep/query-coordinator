class TileServerController < ActionController::Base
  include ActionControllerExtensions
  include CommonSocrataMethods

  def proxy_request

    if params['renderTrackingId']
      cookies["renderTrackingId_#{params['renderTrackingId']}"] = 1
    end

    begin
      result = tileserver.fetch_tile(
        params[:page_id],
        params[:field_id],
        params[:zoom],
        params[:x_coord],
        params[:y_coord],
        :cookies => forwardable_session_cookies,
        :row_limit => params['$limit']
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
