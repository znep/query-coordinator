require 'httparty'

module Fontana
  module Approval
    class Workflow
      include HTTParty

      APPROVALS_API_URI = URI.parse("#{CORESERVICE_URI}/approvals")

      default_timeout 5.seconds.to_i
      format :json

      ATTRIBUTE_NAMES = %i(id createdAt description displayName domainId outcome reapprovalPolicy updatedAt steps)
      ATTRIBUTE_NAMES.each(&method(:attr_accessor))

      JSON_ATTRIBUTES = %i(displayName description reapprovalPolicy)

      attr_accessor :cookies

      class << self
        def find(workflow_id = nil)
          instance = new

          unless workflow_id
            workflow_id = get(
              APPROVALS_API_URI,
              instance.approval_request_headers
            ).parsed_response.find { |workflow| workflow.to_h['outcome'] == 'publicize' }.to_h['id']
          end
          raise RuntimeError.new('Unable to determine workflow_id') unless workflow_id

          get(
            "#{APPROVALS_API_URI}/#{workflow_id}",
            instance.approval_request_headers
          ).parsed_response.each do |key, value|
            if key == 'steps'
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

      def manual?
        reapprovalPolicy == 'manual'
      end

      def automatic?
        reapprovalPolicy == 'auto'
      end

      def require_reapproval=(new_state)
        self.reapprovalPolicy = new_state ? 'manual' : 'auto'
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
        }
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