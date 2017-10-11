class ApprovalsController < ApplicationController

  include ApplicationHelper
  include ApprovalsHelper

  before_filter :require_roled_user

  layout 'styleguide'

  def disable_site_chrome?
    true
  end

  def show

  end

  private

  def require_roled_user
    user = current_user || User.new
    render_forbidden(I18n.t('core.auth.need_permission')) unless user.is_superadmin? || user.is_roled_user?
  end

  def report_error(error_message)
    Airbrake.notify(
      :error_class => 'Approvals',
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end
end
