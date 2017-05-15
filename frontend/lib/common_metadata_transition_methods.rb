module CommonMetadataTransitionMethods
  class UserError < RuntimeError; end
  class UnacceptableError < RuntimeError; end

  def json_parameter(form_key)
    if request.format.json? && request.content_type == Mime::JSON
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
      raise UnacceptableError.new('Content-Type and Accept must be set to JSON')
    end
  end
end
