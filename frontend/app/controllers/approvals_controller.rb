class ApprovalsController < AdministrationController

  include ApplicationHelper
  include AdministrationHelper
  include AssetBrowserHelper

  before_filter :require_approval_right

  layout 'styleguide'

  def disable_site_chrome?
    true
  end

  def show
    @asset_browser_config = {
      :app_name => 'approvals',
      :columns => %w(type name approval_requested owner status actions),
      :initial_tab => 'myQueue',
      :filters_enabled => true
    }
    @approvers = User.find_with_right('configure_approvals')
  end

  private

  def require_approval_right
    render_forbidden(I18n.t('core.auth.need_permission')) unless user_can_review_approvals?
  end

  def report_error(error_message)
    Airbrake.notify(
      :error_class => 'Approvals',
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end

end
