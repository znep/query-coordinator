module Fontana
  module Approval
    class Task

      ATTRIBUTE_NAMES = %i(id approvalWorkflowStep approvalWorkflowStepId createdAt description displayName presetState scope updatedAt)
      ATTRIBUTE_NAMES.each(&method(:attr_accessor))

      JSON_ATTRIBUTES = %i(displayName description scope presetState)

      def initialize(approvalWorkflowStep, data)
        self.approvalWorkflowStep = approvalWorkflowStep
        data.each do |key, value|
          public_send("#{key}=", value)
        end
      end

      def approve?
        presetState == 'approved'
      end

      def approve!
        self.presetState = 'approved'
      end

      def pending?
        presetState == 'pending'
      end
      alias :manual? :pending?

      def pending!
        self.presetState = 'pending'
      end
      alias :manual! :pending!

      def reject?
        presetState == 'rejected'
      end

      def reject!
        self.presetState = 'rejected'
      end

      def official?
        scope == 'official'
      end

      def community?
        scope == 'community'
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
