require_relative 'consumer'

module ActiveMQ

  # Handler for ActiveMQ messages.
  class Dispatcher

    # Bootstraps a consumer.
    def initialize(hosts, queue)
      @consumer = Consumer.new(hosts, queue)
    end

    # Runs the consumer and processes messages as appropriate.
    # Dispatches only for any event types we're interested in.
    # NOTE: The subscribe call runs until interrupted.
    def start
      @consumer.subscribe do |message|
        tag, details = message.values_at('tag', 'details')
        case tag
        when 'DOMAIN_UPDATED'
          handle_domain_updated(details)
        else
          # Ignore all other events.
          # Because of the way Eurybates works, we're drinking from the firehose
          # so it's not particularly useful to log on events we don't consume.
        end
      end
    end

    private

    def handle_domain_updated(message_details)
      properties = %w(id name shortName cname aliases)
      old_domain, new_domain = message_details.values_at('oldDomain', 'domain').map do |domain|
        domain.slice(*properties)
      end

      old_aliases = old_domain.fetch('aliases', '').split(',').reject(&:empty?)
      new_aliases = new_domain.fetch('aliases', '').split(',').reject(&:empty?)

      # When do we need to rewrite properties that include a domain?
      # A) When the primary cname changes
      # B) When an alias is removed [in case that domain alias was in use]
      if old_domain['cname'] != new_domain['cname'] || new_aliases.size < old_aliases.size
        UpdateDomainsJob.perform_later(old_domain, new_domain)
      end
    end
  end
end
