class Api::V1::PermissionsController < ApplicationController
  force_ssl_for_internet_requests

  def update
    permissions = PermissionsUpdater.new(current_user, current_user_story_authorization, params[:uid])
    permissions_response = nil

    begin
      permissions_response = permissions.update_permissions(is_public: params[:isPublic])
    rescue => exception
      AirbrakeNotifier.report_error(exception, message: 'Permissions service object did not instantiate successfully.')
    end

    if permissions_response.nil?
      render json: {error: true}, status: :internal_server_error
    else
      render json: {isPublic: params[:isPublic]}, status: :ok
    end
  end
end
