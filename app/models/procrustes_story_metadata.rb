# Loads in metadata via goal instance. Only valid for goals backed
# by odysseus (i.e., goal narratives).
class ProcrustesStoryMetadata
  include StoryMetadata

  attr_accessor(:metadata)

  def initialize(goal)
    @metadata = {
      uid: goal.uid,
      title: goal.title,
      description: goal.description,
      tile_config: {}, #TODO if needed
      grants: {},
      permissions: {
        isPublic: goal.public?
      },
      owner_id: nil #TODO if needed
    }
  end

  def goal?
    true
  end
end
