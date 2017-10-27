module ApprovalsHelper

  def render_approvals_initial_state
    approvals_config = {
      approvers: @approvers.to_json
    }
    javascript_tag("window.approvalsConfig = #{json_escape(approvals_config.to_json)};")
  end

end
