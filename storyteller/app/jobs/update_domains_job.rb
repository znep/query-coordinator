require_relative '../../lib/jobs/globally_ordered'

class UpdateDomainsJob < ActiveJob::Base
  include GloballyOrdered # :holdontoyourbutts:

  queue_as :domains

  rescue_from(StandardError) do |error|
    ::AirbrakeNotifier.report_error(error, on_method: "UpdateDomainsJob#perform")
    raise error
  end

  def perform(old_domain, new_domain)
    enforce_execution_order(:domains) { DomainUpdater.migrate(old_domain, new_domain) }
  end
end
