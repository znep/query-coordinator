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
end
