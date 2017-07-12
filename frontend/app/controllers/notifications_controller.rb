# frozen_string_literal: true
class NotificationsController < ApplicationController
  include NotificationsHelper

  def index
    render json: {
      # notifications_from_zendesk from the NotificationsHelper
      notifications: notifications_from_zendesk,
      viewOlderLink: APP_CONFIG.zendesk_notifications.fetch(:zendesk_link).html_safe
    }
  end

  def set_last_notification_seen_at
    begin
      CoreServer::Base.connection.patch_request('/notifications?method=setLastNotificationSeenAt')
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        return render json: {}, status: :unauthorized
      else
        raise e
      end
    end

    # Note that, if the above call fails, a notification gets sent to airbrake and
    # the call will silently fail in the browser (print an error message)
    # If it succeeds, it returns an empty string, but rails wants us to render _something_ here
    # regardless, hence this empty JSON render...
    render json: {}
  end
end
