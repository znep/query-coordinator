module ApprovalsHelper

  def approvals_initial_state
    {
      approvers: @approvers,
      approvalWorkflowId: @approval_workflow.id
    }
  end

  def render_approvals_translations
    translations = json_escape(LocaleCache.render_partial_translations(app_name.to_sym).to_json)
    javascript_tag("window.translations = #{translations}")
  end
end
