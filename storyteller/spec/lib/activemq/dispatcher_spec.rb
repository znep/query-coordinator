require 'rails_helper'

require 'activemq/dispatcher'

describe ActiveMQ::Dispatcher do
  let(:subject) { ActiveMQ::Dispatcher.new(:hosts, :queue) }
  let(:consumer) { instance_double('ActiveMQ::Consumer') }

  before do
    allow(ActiveMQ::Consumer).to receive(:new).and_return(consumer)
  end

  context '#handle_domain_updated' do
    it 'queues UpdateDomainsJob when cname changes' do
      old_domain = {'cname' => 'foo', 'aliases' => 'abc'}
      new_domain = {'cname' => 'bar', 'aliases' => 'abc'}

      expect(UpdateDomainsJob).to receive(:perform_later).with(old_domain, new_domain)

      subject.send(:handle_domain_updated, 'oldDomain' => old_domain, 'domain' => new_domain)
    end

    it 'queues UpdateDomainsJob when an alias has been removed' do
      old_domain = {'cname' => 'foo', 'aliases' => 'abc,def'}
      new_domain = {'cname' => 'foo', 'aliases' => 'abc'}

      expect(UpdateDomainsJob).to receive(:perform_later).with(old_domain, new_domain)

      subject.send(:handle_domain_updated, 'oldDomain' => old_domain, 'domain' => new_domain)
    end

    it 'does nothing when an alias has been added' do
      old_domain = {'cname' => 'foo', 'aliases' => 'abc'}
      new_domain = {'cname' => 'foo', 'aliases' => 'abc,def'}

      expect(UpdateDomainsJob).not_to receive(:perform_later)

      subject.send(:handle_domain_updated, 'oldDomain' => old_domain, 'domain' => new_domain)
    end
  end
end
