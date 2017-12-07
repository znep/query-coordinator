require 'httparty'

module Fontana
  module Approval
    class Workflow
      include HTTParty

      APPROVALS_API_URI = URI.parse('http://localhost/api/approvals')

      base_uri APPROVALS_API_URI.to_s
      default_timeout 5.seconds.to_i
      format :json

      ATTRIBUTE_NAMES = %i(id createdAt description displayName domainId outcome reapprovalPolicy updatedAt steps)
      ATTRIBUTE_NAMES.each(&method(:attr_accessor))

      JSON_ATTRIBUTES = %i(displayName description reapprovalPolicy)

      attr_accessor :cookies

      class << self
        def find(id)
          instance = new
          get("/#{id}").parsed_response.each do |key, value|
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
          "/#{id}",
          :headers => approval_request_headers,
          :body => as_json.to_json
        )
        if result.success?
          steps.each do |step|
            step.tasks.each do |task|
              update_task(task)
            end
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
          :headers => approval_request_headers,
          :query => {
            :method => 'updateTask',
            :taskId => task.id
          },
          :body => task.to_json
        )
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
