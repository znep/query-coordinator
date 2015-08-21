class DraftStory < ActiveRecord::Base
  include Immutable
  include StoryValidations
  include StoryQueries
  include BlockOperations
  include StoryAsJson

  before_create :set_digest

  private

  def set_digest
    self.digest = Digest::MD5.hexdigest(self.as_json.to_s)
  end
end
