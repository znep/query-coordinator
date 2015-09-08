class Api::V1::PermissionsController < ApplicationController

  def update
    permissions = Permissions.new(current_user, params[:uid], core_request_headers)
    permissions_response = nil

    begin
      request_payload = JSON.parse(request.body.read)
      permissions_response = permissions.update_permissions(is_public: request_payload[:isPublic])
    rescue => exception
      AirbrakeNotifier.report_error(exception, 'Permissions service object did not instantiate successfully.')
    end

    if permissions_response.nil?
      render json: {error: true}, status: :internal_server_error
    else
      render json: {isPublic: params[:isPublic]}, status: :ok
    end
  end

  private

  def core_request_headers
    CoreServer::headers_from_request(request)
  end
end
