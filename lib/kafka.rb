require 'httparty'

module Kafka
  @@kafka_rest_uri = APP_CONFIG.kafka_rest_uri

  def self.produce(topic, value_schema, value)
    # TODO cache schema ids
    # TODO queue messages on 408 response
    path = "#{@@kafka_rest_uri}/topics/#{topic}"
    body = {value_schema: value_schema, records: [{value: value}]}.to_json
    response = HTTParty.post(
      path,
      body: body,
      headers: {'Content-Type' => 'application/vnd.kafka.avro.v1+json'}
    )
    response.code == 200
  end
end
