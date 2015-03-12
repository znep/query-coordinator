module CommonMetadataTransitionMethods
  class UserError < RuntimeError; end
  class UnacceptableError < RuntimeError; end

  def metadata_transition_phase
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:metadata_transition_phase].to_s.downcase
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
      raise UserError.new("Key #{form_key} not found.") unless params[form_key].present?

      return JSON.parse(params[form_key]).with_indifferent_access
    elsif request.format.json? && request.content_type == Mime::JSON
      request_body = request.body.read

      # Make sure to rewind the stream since there is no guarantee that
      # this method will only be called once.
      request.body.rewind

      unless request_body.length > 0
        Airbrake.notify(
          :error_class => "EmptyRequestBody",
          :error_message => "Request body was empty: " \
            "#{request.inspect} (Captured request body: #{request_body.inspect})"
        )
        raise UserError.new('Empty JSON body')
      end

      posted_params = JSON.parse(request_body)

      return posted_params.with_indifferent_access
    else
      # phase 2 requires content-type:application/json
      raise UnacceptableError.new('Content-Type and Accept must be set to JSON')
    end
  end
end
