class OdysseusPermissionsUpdater
  include UserAuthorizationHelper

  def initialize(uid)
    @uid = uid

    goal = OpenPerformance::Goal.new(uid)
    raise ArgumentError.new('Must initialize OdysseusPermissionsUpdater service object with valid uid.') unless goal.accessible?
  end

  def update_permissions(options)
    raise ArgumentError.new("'is_public' must be set as an option.") unless options.key?(:is_public)

    if can_edit_goals?
      return OpenPerformance::Odysseus.set_goal_visibility(uid, options[:is_public]).ok?
    end

    false
  end

  private

  attr_reader :uid
end
