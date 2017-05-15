class PolaroidController < ActionController::Base
  include ActionControllerExtensions
  include CommonSocrataMethods

  def proxy_request

    if params['renderTrackingId']
      cookies["renderTrackingId_#{params['renderTrackingId']}"] = {
        value: 1,
        expires: 1.hour.from_now
      }
    end

    vif = params[:vif].with_indifferent_access
    begin
      result = polaroid.fetch_image(
        vif,
        :cookies => forwardable_session_cookies
      )
    rescue => error
      Rails.logger.error("#{error.message}\n#{error.backtrace.join('\n ')}")

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
        :filename => "#{vif[:datasetUid]}-#{vif[:columnName]}-#{vif[:type]}.png"
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
