class PhidippidesDatasetsController < ActionController::Base

  include CommonPhidippidesMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods

  before_filter :hook_auth_controller

  helper :all # include all helpers, all the time

  hide_action :current_user, :current_user_session

  helper_method :current_user
  helper_method :current_user_session

  def index
    return render :nothing => true, :status => '406' unless request.format.to_s == 'application/json'
    return render :nothing => true, :status => '400' unless params[:id].present?

    begin
      result = phidippides.fetch_pages_for_dataset(
        params[:id],
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      render :json => result[:body], :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  def show
    return render :nothing => true, :status => '406' unless request.format.to_s == 'application/json'
    return render :nothing => true, :status => '400' unless params[:id].present?

    begin
      result = phidippides.fetch_dataset_metadata(params[:id], :request_id => request_id, :cookies => forwardable_session_cookies)

      if result[:status] == "200"
        # This is temporary, but constitutes a rolling migration.
        # Eventually we can check that every extant dataset metadata
        # blob has a 'defaultPage' property and remove this migration
        # step.
        phidippides.migrate_dataset_metadata_to_v1(result)

        # Moving forward, we also compute and insert two card type mapping
        # properties on columns before we send them to the front-end.
        # This method call will check the metadata transition phase
        # internally and just pass through if it is not set to '3'.
        phidippides.set_default_and_available_card_types_to_columns!(result)
      end

      render :json => result[:body], :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  def create
    # By design, cannot create dataset metadata past phase 0
    return render :nothing => true, :status => '404' unless metadata_transition_phase_0?
    return render :nothing => true, :status => '401' unless can_update_metadata?
    return render :nothing => true, :status => '405' unless request.post?
    return render :nothing => true, :status => '400' unless params[:datasetMetadata].present?

    begin
      result = phidippides.create_dataset_metadata(JSON.parse(params[:datasetMetadata]), :request_id => request_id, :cookies => forwardable_session_cookies)
      render :json => result[:body], :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    rescue JSON::ParserError => error
      render :json => { :body => "Invalid JSON payload. Error: #{error}" }, :status => '400'
    end
  end

  def update
    return render :nothing => true, :status => '401' unless can_update_metadata?
    return render :nothing => true, :status => '405' unless request.put?

    begin
      dataset_metadata = json_parameter(:datasetMetadata)
    rescue CommonMetadataTransitionMethods::UserError => error
      return render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue CommonMetadataTransitionMethods::UnacceptableError => error
      return render :json => { :body => "Error: #{error}" }, :status => '406'
    end

    # Support legacy API where the dataset id is specified in the json body as well.
    dataset_id = dataset_metadata.fetch(:id, false)
    if dataset_id
      if dataset_id != params[:id]
        # Something fishy is going on - hitting the REST endpoint for one page id, but putting
        # another in the payload to update? That's a no-no.
        return render :json => {
          :body => "Error: datasetId in json body must match endpoint: #{dataset_id} vs #{params[:id]}"
        }, :status => '406'
      end
    else
      dataset_metadata[:id] = params[:id]
    end

    begin
      result = phidippides.update_dataset_metadata(
        dataset_metadata,
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      if metadata_transition_phase_0?
        render :json => result[:body], :status => result[:status]
      else
        return head :status => '204'
      end
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  def destroy
    if metadata_transition_phase_0?
      render :nothing => true, :status => '403'
    else
      render :nothing => true, :status => '400'
    end
  end
end
