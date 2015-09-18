module Constraints

  class ResourceConstraint

    def matches?(request)
      params = request.path_parameters
      valid_uid?(params[:id])
    end

    def valid_uid?(uid)
      uid =~ Frontend::UID_REGEXP
    end

  end

end
