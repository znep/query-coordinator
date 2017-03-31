class ConsulChecksController < ApplicationController

  def active
    status = if StorytellerService.active?
      :ok
    else
      :service_unavailable
    end

    render nothing: true, status: status
  end
end
