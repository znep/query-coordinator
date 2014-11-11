class PolaroidController < ActionController::Base
  include ActionControllerExtensions
  include CommonSocrataMethods

  def proxy_request

    if params['renderTrackingId']
      cookies["renderTrackingId_#{params['renderTrackingId']}"] = 1
    end

    begin
      result = polaroid.fetch_image(
        params[:page_id],
        params[:field_id],
        :cookies => forwardable_session_cookies
      )
    rescue => error
      Rails.logger.error(error_message = "Unable to proxy image service due to error: #{error.to_s}")

      result = {
        status: '500',
        body: {
          error: true,
          reason: 'Error accessing image service',
          details: error.to_s
        }
      }
    end

    if result[:status] == '200'
      send_data(
        result[:body],
        :type => result[:content_type],
        :disposition => params.fetch('disposition', 'attachment'),
        :filename => "#{params[:page_id]}-#{params[:field_id]}.png"
      )
    else
      render result.update(:json => result[:body])
    end

  end

  private

  def polaroid
    @polaroid ||= Polaroid.new
  end

end
