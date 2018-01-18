require 'rails_helper'

describe ApplicationHelper do
  include TestHelperMethods

  before do
    init_current_domain
    init_feature_flag_signaller
  end

  describe 'render_asset_browser_server_config' do
    context 'when fontana approvals are disabled' do
      before do
        allow(Fontana::Approval::Workflow).to receive(:find).and_return(nil)
      end

      it 'should not include the approvalSettings section' do
        result = helper.render_asset_browser_server_config
        expect(result).not_to match('approvalSettings')
      end
    end

    context 'when fontana approvals are enabled' do
      let(:mock_workflow) do
        OpenStruct.new(:steps => [
          OpenStruct.new(
            :official_task => OpenStruct.new(:manual? => false),
            :community_task => OpenStruct.new(:manual? => true)
          )
        ])
      end

      before do
        allow(Fontana::Approval::Workflow).to receive(:find).and_return(mock_workflow)
      end

      it 'should include the approvalSettings section' do
        result = helper.render_asset_browser_server_config
        expect(result).to match('approvalSettings')
      end
    end

  end
end
