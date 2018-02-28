module ApprovalsStubs

  def stub_approvals_settings(body = [])
    allow(::Fontana::Approval::Workflow).to receive(:settings).and_return(body.to_json)
  end
end

RSpec.configure do |config|
  config.include ApprovalsStubs
end
