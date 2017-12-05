module Fontana
  module Approval
    class Step

      ATTRIBUTE_NAMES = %i(id approvalWorkflow approvalWorkflowId createdAt description displayName updatedAt tasks)
      ATTRIBUTE_NAMES.each(&method(:attr_accessor))

      JSON_ATTRIBUTES = %i(displayName description)

      def initialize(approvalWorkflow, data)
        self.approvalWorkflow = approvalWorkflow
        data.each do |key, value|
          if key == 'tasks'
            public_send(:tasks=, value.map { |task| Fontana::Approval::Task.new(self, task) })
          else
            public_send("#{key}=", value)
          end
        end
      end

      def official_task
        tasks.find(&:official?)
      end

      def community_task
        tasks.find(&:community?)
      end

      def as_json(keys = JSON_ATTRIBUTES)
        Hash[keys.map { |key| [key, public_send(key)] }]
      end

      def to_json(keys = JSON_ATTRIBUTES)
        as_json(keys)
      end

    end
  end
end
