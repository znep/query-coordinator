class InternalAssetManagerController < ApplicationController

  include ApplicationHelper
  include InternalAssetManagerHelper

  before_action :require_administrator

  layout 'styleguide'

  def show
  end

  private

  def require_administrator
    return require_user(true) unless current_user.present?

    unless current_user.try(:is_any?, :administrator, :superadmin)
      flash.now[:error] = 'You do not have permission to view this page'
      render 'shared/error', :status => :forbidden
    end
  end
end
