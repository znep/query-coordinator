module ApprovalsHelper

  def approvals_initial_state
    {
      approvers: @approvers,
      approvalWorkflowId: @approval_workflow.id
    }
  end

end
