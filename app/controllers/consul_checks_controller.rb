class ConsulChecksController < ApplicationController
  skip_before_filter :require_logged_in_user
  force_ssl except: [:active]

  def active
    status = if StorytellerService.active?
      :ok
    else
      :service_unavailable
    end

    render nothing: true, status: status
  end
end
