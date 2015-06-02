class DraftStory < ActiveRecord::Base
  include Immutable
  include StoryValidations
  include StoryQueries
  include BlockOperations

end
