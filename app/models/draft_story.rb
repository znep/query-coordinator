class DraftStory < ActiveRecord::Base
  include StoryValidations
  include BlockOperations

end
