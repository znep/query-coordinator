class AdministrationController < ApplicationController
  before_filter :check_auth
  layout 'dataset_v2'

  def analytics
    @type = params[:type] || @@default_analytics_type
  end

  private
  def check_auth(level = 'manage_users')
    unless CurrentDomain.user_can?(current_user, level)
      flash.now[:error] = "You do not have permission to view this page"
      return (render 'shared/error', :status => :forbidden)
    end
  end

  @@default_analytics_type = 'overview'
end
