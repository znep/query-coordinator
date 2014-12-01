class NewUxBootstrapController < ActionController::Base
  include CommonPhidippidesMethods

  before_filter :hook_auth_controller

  def bootstrap
    return render :nothing => true, :status => :forbidden unless has_rights?

    # Grab the page 4x4s associated with this dataset id
    pages = page_metadata_manager.pages_for_dataset(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    case pages[:status]
    when '200'
      # If has page ids already, redirect to them
      if pages.try(:[], :body).try(:[], :publisher).present?
        return redirect_to "/view/#{pages[:body][:publisher].last[:pageId]}"
      end
    when '404'
      # do nothing - let it fall through
    else
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Dataset #{params[:id]} failed to return pages for bootstrapping.",
        :request => { :params => params },
        :context => { :pages_response => pages }
      )
      Rails.logger.error("Dataset #{params[:id]} failed to return pages for bootstrapping. " +
                         "#{pages[:status]} #{pages[:body]}")
      flash[:error] = I18n.t('screens.ds.new_ux_error')
      return redirect_to action: 'show', controller: 'datasets'
    end

    # Grab the dataset metadata and use the cardinality to create cards
    dataset_metadata_result = phidippides.fetch_dataset_metadata(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )
    if dataset_metadata_result[:status] != '200' || dataset_metadata_result.try(:[], :body).blank?
      return render :nothing => true, :status => 404
    end

    newux_page = create_new_ux_page(dataset_metadata_result[:body])

    page_creation_result = page_metadata_manager.create(
      newux_page,
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    if page_creation_result[:status] != '200'
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Error creating page for dataset #{params[:id]}",
        :request => { :params => params },
        :context => { :page_creation_result => page_creation_result }
      )
      Rails.logger.error("Error creating page for dataset #{params[:id]}: " +
                         "#{page_creation_result[:status]} #{page_creation_result[:body]}")
      flash[:error] = I18n.t('screens.ds.new_ux_error')
      return redirect_to action: 'show', controller: 'datasets'
    end

    return redirect_to "/view/#{page_creation_result[:body][:pageId]}"
  end

  private

  def create_new_ux_page(dataset_metadata)
    # TODO: filter based on available card types & cardinality
    cards = dataset_metadata[:columns].map do |column|
      unless Phidippides::SYSTEM_COLUMN_ID_REGEX.match(column[:name])
        card = PageMetadataManager::CARD_TEMPLATE.deep_dup
        card.merge!(
          'description' => column[:title],
          'fieldName' => column[:name],
          'cardinality' => column[:cardinality],
        )
      end
    end.compact.first(9) # 9 cards, + the table card

    {
      'datasetId' => dataset_metadata[:id],
      'name' => dataset_metadata[:name],
      'description' => dataset_metadata[:description],
      'cards' => cards
    }
  end

  def dataset
    View.find(params[:id])
  end
end

