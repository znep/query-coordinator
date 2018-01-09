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

  # This dance is due to the find_with_right API returning JSON with missing User properties (i.e. email)
  # TODO https://socrata.atlassian.net/browse/EN-20844
  def fetch_users_with_approvals_rights
    approvers = User.find_with_right(UserRights::CONFIGURE_APPROVALS).map do |user|
      User.find(user.id)
    end

    approvers.concat(User.find_with_right(UserRights::REVIEW_APPROVALS).map do |user|
      User.find(user.id)
    end).to_a.uniq(&:id).sort_by(&:displayName)
  end
end

def workflow_exists?
  @approval_workflow.try(:steps).to_a.length > 0
end

def workflow_official_task
  @approval_workflow.steps.first.official_task
end

def workflow_community_task
  @approval_workflow.steps.first.community_task
end
