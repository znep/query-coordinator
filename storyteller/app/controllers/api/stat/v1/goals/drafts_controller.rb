class Api::Stat::V1::Goals::DraftsController < Api::V1::DraftsController
  # Blank, this just differs from the normal Api::V1::DraftsController in the
  # permissions we want to apply, which are handled in ApplicationController.
  # The permissions are keyed off of the controller class, hence why this
  # controller must be separate.
end
