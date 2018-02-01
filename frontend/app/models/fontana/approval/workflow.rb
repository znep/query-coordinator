require 'httparty'

module Fontana
  module Approval
    class Workflow
      include HTTParty

      APPROVALS_API_URI = URI.parse("#{CORESERVICE_URI}/approvals")

      default_timeout 5.seconds.to_i
      format :json

      ATTRIBUTE_NAMES = %i(id description displayName domainId outcome steps)
      ATTRIBUTE_NAMES.each(&method(:attr_accessor))

      JSON_ATTRIBUTES = %i(displayName description)

      attr_accessor :cookies

      class << self
        def find(workflow_id = nil)
          instance = new

          unless workflow_id
            workflow_id = get(
              APPROVALS_API_URI,
              :headers => instance.approval_request_headers
            ).parsed_response.find { |workflow| workflow.to_h['outcome'] == 'publicize' }.to_h['id']
          end

          raise RuntimeError.new('Unable to determine workflow_id') unless workflow_id

          response = get(
            "#{APPROVALS_API_URI}/#{workflow_id}",
            :headers => instance.approval_request_headers
          ).parsed_response.with_indifferent_access

          ATTRIBUTE_NAMES.each do |key|
            # An approvals workflow with no steps, is implicitly treated as "all approvals are automatic"
            next if key == :steps && response[key].blank?

            value = response.fetch(key)
            if key == :steps
              instance.public_send(:steps=, value.map { |step| Fontana::Approval::Step.new(instance, step) })
            else
              instance.public_send("#{key}=", value)
            end
          end
          instance
        end
      end

      def initialize
        @cookies = nil
      end

      def update
        result = self.class.put(
          "#{APPROVALS_API_URI}/#{id}",
          :headers => approval_request_headers,
          :body => to_json
        )
        if result.success?
          steps.each do |step|
            step.tasks.each(&method(:update_task))
          end
        end

        unless result.success?
          raise RuntimeError.new("Request failed: #{result.to_a.join(', ')}")
        end
      end

      def update_task(task)
        raise RuntimeError.new('Cookies are required to update workflow tasks') unless cookies.present?
        result = self.class.put(
          APPROVALS_API_URI,
          :query => {
            :method => 'updateTask',
            :taskId => task.id
          },
          :headers => approval_request_headers,
          :body => task.to_json
        )

        unless result.success?
          raise RuntimeError.new("Request failed: #{result.to_a.join(', ')}")
        end
      end

      def update_step(step)
        raise RuntimeError.new('not implemented')
      end

      def approval_request_headers
        {
          'Content-Type' => 'application/json',
          'Cookie' => cookies,
          'X-Socrata-Host' => CurrentDomain.cname
        }.compact
      end

      def as_json(keys = JSON_ATTRIBUTES)
        Hash[keys.map { |key| [key, public_send(key)] }].to_json
      end

      def to_json(keys = ATTRIBUTE_NAMES)
        Hash[keys.map { |key| [key, public_send(key)] }].to_json
      end

    end
  end
end
