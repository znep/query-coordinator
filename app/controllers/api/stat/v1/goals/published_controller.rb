class Api::Stat::V1::Goals::PublishedController < Api::V1::PublishedController
  # Blank, this just differs from the normal Api::V1::PublishedController in the permissions
  # we want to apply, which are handled in ApplicationController.
  # The permissions are keyed off of the controller class, hence why this controller must
  # be separate.
end
