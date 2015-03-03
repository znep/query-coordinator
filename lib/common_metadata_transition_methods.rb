module CommonMetadataTransitionMethods
  class UserError < RuntimeError; end
  class UnacceptableError < RuntimeError; end

  def metadata_transition_phase
    FeatureFlags.derive(nil, nil)[:metadata_transition_phase].to_s.downcase
  end

  def metadata_transition_phase_0?
    metadata_transition_phase == '0' || metadata_transition_phase == 'false'
  end

  def metadata_transition_phase_1?
    metadata_transition_phase == '1'
  end

  def metadata_transition_phase_2?
    metadata_transition_phase == '2'
  end

  def metadata_transition_phase_3?
    metadata_transition_phase == '3'
  end

  def json_parameter(form_key)
    if metadata_transition_phase_0? || metadata_transition_phase_1?
      raise UserError unless params[form_key].present?

      return JSON.parse(params[form_key])
    elsif request.format.json? && request.content_type == Mime::JSON
      raise UserError if params.empty?

      return params
    else
      # phase 2 requires content-type:application/json
      raise UnacceptableError
    end
  end
end
