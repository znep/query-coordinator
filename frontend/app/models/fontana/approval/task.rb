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

      def approved?
        presetState == 'approved'
      end

      def approved!
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

      def rejected?
        presetState == 'rejected'
      end

      def rejected!
        self.presetState = 'rejected'
      end

      def official?
        scope == 'official'
      end

      def community?
        scope == 'community'
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
