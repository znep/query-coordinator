# ActiveMQ consumer config
hosts_string_list = ENV['ACTIVEMQ_STOMP_CONNECTION_STRING_LIST'] || 'stomp://localhost:61613'
queue_name = ENV['ACTIVEMQ_STOMP_QUEUE'] || '/queue/eurybates.storyteller'

Rails.application.config.activemq = {
  :stomp_hosts => hosts_string_list.split(','),
  :stomp_queue => queue_name
}
