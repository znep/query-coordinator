require 'rails_helper'

RSpec.describe UpdateDomainsJob, type: :job do

  before do
    # Voodoo to ignore the ramifications of GloballyOrdered
    # see https://relishapp.com/rspec/rspec-mocks/v/3-5/docs/configuring-responses/block-implementation#yield-to-the-caller's-block
    allow_any_instance_of(UpdateDomainsJob).to receive(:enforce_execution_order) do |&block|
      block.call
    end
  end

  describe '#perform' do
    let(:old_domain) { :old_domain }
    let(:new_domain) { :new_domain }

    it 'sends old and new domains to DomainUpdater service object' do
      expect(DomainUpdater).to receive(:migrate).with(old_domain, new_domain)
      UpdateDomainsJob.perform_now(old_domain, new_domain)
    end

    context 'when processing fails' do
      it 'notifies airbrake' do
        error = StandardError.new('Y U NO AIRBRAKE?')
        allow_any_instance_of(UpdateDomainsJob).to receive(:perform).and_raise(error)
        allow(AirbrakeNotifier).to receive(:report_error)

        expect {
          UpdateDomainsJob.perform_now(old_domain, new_domain)
        }.to raise_error(error)

        expect(AirbrakeNotifier).to have_received(:report_error).with(error, on_method: "UpdateDomainsJob#perform")
      end
    end
  end
end
