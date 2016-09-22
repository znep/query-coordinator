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
      client = Stomp::Client.open(
        hosts: @hosts,
        randomize: true
      )

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

      begin
        Rails.logger.info('ActiveMQ::Consumer awaiting messages from queue...')
        client.join
      rescue SystemExit, Interrupt, SignalException
        Rails.logger.info('Shutdown signal received...')
      rescue StandardError => ex
        Rails.logger.error("ActiveMQ::Consumer received error from Stomp::Client; re-raising...")
        raise ex
      ensure
        client.close
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
