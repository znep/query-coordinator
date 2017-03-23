module Constraints

  # NOTE: Temporarily defining this here because Frontend::UID_REGEXP is
  # non-strict (doesn't check start/end anchors). Moreover, Frontend::UID_REGEXP
  # actually _needs_ to be non-strict because Rails rejects anchor characters
  # in hash-based constraints.
  ANCHORED_UID_REGEXP = /^\w{4}-\w{4}$/

  class ResourceConstraint

    def matches?(request)
      params = request.path_parameters
      valid_uid?(params[:id])
    end

    def valid_uid?(uid)
      uid =~ ANCHORED_UID_REGEXP
    end

  end

end
