require 'stomp'

module ActiveMQ

  # Interface to ActiveMQ queue. Contains no app-specific processing.
  class Consumer

    # Exposes host and queue configuration.
    def initialize(hosts, queue)
      @hosts = hosts.map do |host|
        uri = URI.parse(host)
        {host: uri.host, port: uri.port}
      end
      @queue = queue
    end

    # Retrieves messages for processing and acknowledges them.
    def subscribe(&block)
      # NOTE: Our "Eurybates" ActiveMQ architecture can be thought of as a
      # firehose with multiple nodes: every queue receives every message, but
      # each queue exists on one or more nodes (and each node gets different
      # messages). Because the firehose may be spread across multiple nodes,
      # we need one process for every node; otherwise we will receive some
      # messages but not others.
      #
      # The hosts property of Stomp::Client is used for failover, which is not
      # the same use of multiple nodes as described above. We basically assume
      # (from Storyteller's point of view) that the death of an ActiveMQ node
      # is someone else's problem.
      clients = @hosts.map do |host|
        client = Stomp::Client.open(hosts: [host])

        client.subscribe(@queue, :ack => 'client', 'activemq.prefetchSize' => 1) do |message|
          begin
            parsed_message = self.class.parse(message.body)
            yield(parsed_message) unless parsed_message.nil?
          rescue StandardError => ex
            Rails.logger.error("Unexpected error in ActiveMQ::Consumer: #{ex.message}")
            ::AirbrakeNotifier.report_error(ex, message: 'Unexpected error in ActiveMQ::Consumer.')
          ensure
            client.acknowledge(message)
          end
        end

        client
      end

      begin
        Rails.logger.info('ActiveMQ::Consumer awaiting messages from queue...')
        clients.each(&:join)
      rescue SystemExit, Interrupt, SignalException
        Rails.logger.info('Shutdown signal received...')
      rescue StandardError => ex
        Rails.logger.error("ActiveMQ::Consumer received error from Stomp::Client; re-raising...")
        raise ex
      ensure
        clients.each(&:close)
        Rails.logger.info('Closed Stomp::Client.')
      end
    end

    private

    def self.parse(message_body)
      begin
        JSON.parse(message_body, :max_nesting => false)
      rescue JSON::ParserError
        Rails.logger.error("ActiveMQ::Consumer failed to parse as JSON: #{message_body}")
        nil
      end
    end
  end
end
