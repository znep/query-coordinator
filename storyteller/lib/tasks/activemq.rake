require_relative '../activemq/dispatcher'

namespace :activemq do
  desc 'Respond to Eurybates events over ActiveMQ'
  task :listen => :environment do
    dispatcher = ActiveMQ::Dispatcher.new(
      Rails.application.config.activemq[:stomp_hosts],
      Rails.application.config.activemq[:stomp_queue]
    )
    dispatcher.start
  end
end
