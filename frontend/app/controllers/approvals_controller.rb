class ApprovalsController < AdministrationController

  include ApplicationHelper
  include AdministrationHelper
  include AssetBrowserHelper
  include ApprovalsHelper

  before_filter :require_approval_right
  before_filter :fetch_approvers, :only => :settings
  before_filter :fetch_approval

  layout 'styleguide'

  def disable_site_chrome?
    true
  end

  def show
    @asset_browser_config = {
      :app_name => 'approvals',
      :filters_enabled => true
    }
    @approvers = User.find_with_right('configure_approvals')
  end

  def settings
    if request.post?
      @approval_workflow.steps.first.official_task.approved! if params[:official_approval_strategy] == 'automatic'
      @approval_workflow.steps.first.official_task.manual! if params[:official_approval_strategy] == 'manual'

      @approval_workflow.steps.first.community_task.approved! if params[:community_approval_strategy] == 'automatic'
      @approval_workflow.steps.first.community_task.manual! if params[:community_approval_strategy] == 'manual'
      @approval_workflow.steps.first.community_task.rejected! if params[:community_approval_strategy] == 'reject'

      @approval_workflow.require_reapproval = params[:reapproval_strategy]

      @approval_workflow.update

      # TODO Error handling (don't redirect when there's an error, re-render the page instead)
      flash[:notice] = 'Settings successfully updated'
      redirect_to '/admin/approvals'
    end
  end

  private

  def fetch_approval
    @approval_workflow = Fontana::Approval::Workflow.find(params[:id])
    @approval_workflow.cookies = forwardable_session_cookies
  end

  def fetch_approvers
    @approvers = fetch_users_with_approvals_rights
  end

  def require_approval_right
    render_forbidden(I18n.t('core.auth.need_permission')) unless user_can_review_approvals?
  end

  def report_error(error_message)
    Airbrake.notify(
      :error_class => 'FontanaApprovals',
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end

end
