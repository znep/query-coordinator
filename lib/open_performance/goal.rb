# This class provides mediated access to Open Performance goals.
require 'open_performance/odysseus'

class OpenPerformance::Goal
  attr_reader :uid

  def initialize(uid)
    @uid = uid
  end

  def accessible?
    goal_response.ok?
  end

  def unauthorized?
    goal_response.unauthorized?
  end

  def title
    goal_metadata['name']
  end

  def description
    # None exists. Do we want to use goal headline?
    ''
  end

  def public?
    goal_metadata['is_public']
  end

  def owner_id
    # The equivalence is tenuous - created_by changes on save.
    goal_metadata['created_by']
  end

  def updated_at
    goal_metadata['updated_at']
  end

  def narrative_migration_metadata
    narrative_metadata
  end

  private

  def goal_metadata
    raise "Data inaccessible #{goal_response.code}" unless goal_response.ok?
    goal_response.json
  end

  def narrative_metadata
    raise "Data inaccessible #{narrative_response.code}" unless narrative_response.ok?
    narrative_response.json
  end

  def goal_response
    @goal_response ||= OpenPerformance::Odysseus.get_goal(@uid)
  end

  def narrative_response
    @narrative_response ||= OpenPerformance::Odysseus.get_goal_narrative(@uid)
  end
end
