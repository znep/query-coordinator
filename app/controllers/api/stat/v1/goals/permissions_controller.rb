class Api::Stat::V1::Goals::PermissionsController < Api::V1::PermissionsController
  # Blank, this just differs from the normal Api::V1::PermissionsController in the
  # permissions we want to apply, which are handled in ApplicationController.
  # The permissions are keyed off of the controller class, hence why this
  # controller must be separate.

  private

  # The one difference we need to account for is the service call that twiddles
  # the is_public bit; we need to talk to Odysseus instead of Core for that.
  def permissions_updater
    OdysseusPermissionsUpdater.new(params[:uid])
  end
end
