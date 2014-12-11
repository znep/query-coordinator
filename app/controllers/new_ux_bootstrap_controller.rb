class NewUxBootstrapController < ActionController::Base
  include CommonPhidippidesMethods

  before_filter :hook_auth_controller

  def bootstrap
    # Check to make sure they have permission to create a page
    return render :json => {
      error: true,
      reason: "User must be one of these roles: #{ALLOWED_ROLES.join(', ')}"
    }, :status => :forbidden unless has_rights?

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
      Rails.logger.error("Error creating page for dataset #{params[:id]}: #{page_creation_result}")
      flash[:error] = I18n.t('screens.ds.new_ux_error')
      return redirect_to action: 'show', controller: 'datasets'
    end

    return redirect_to "/view/#{page_creation_result[:body][:pageId]}"
  end

  private

  include CardTypeMapping
  require 'set'

  ALLOWED_ROLES = %w(administrator publisher)

  def create_new_ux_page(dataset_metadata)
    # Keep track of the types of cards we added, so we can give a spread
    added_card_types = Set.new
    skipped_cards_by_type = Hash.new { |h, k| h[k] = [] }

    cards = dataset_metadata[:columns].map do |column|
      unless Phidippides::SYSTEM_COLUMN_ID_REGEX.match(column[:name])
        card_type = card_type_for(column)
        if card_type
          card = PageMetadataManager::CARD_TEMPLATE.deep_dup
          card.merge!(
            'description' => column[:title],
            'fieldName' => column[:name],
            'cardinality' => column[:cardinality],
            'cardType' => card_type,
          )

          if added_card_types.add?(card_type)
            card
          else
            skipped_cards_by_type[card_type] << card
            nil
          end
        end
      end
    end.compact

    if cards.length < 10
      # skipped_cards is an array of arrays, grouped by card type
      skipped_cards = skipped_cards_by_type.values
      # Find the card type with the most cards (to facilitate the zip operation)
      most_cards_of_this_type = skipped_cards.max_by(&:length)
      # Interleave the cards of different types, for the best variety
      interleaved_cards = most_cards_of_this_type.zip(*skipped_cards.select do |cards|
        cards != most_cards_of_this_type
      end).flatten(1).compact
      # Fill out the rest of the cards for the page
      cards = cards.concat(interleaved_cards.first(10 - cards.length))
    else
      cards = cards.first(10)
    end

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

  def has_rights?
    current_user && (ALLOWED_ROLES.include?(current_user.roleName) ||
                     current_user.is_owner?(dataset) ||
                     current_user.is_admin?
                    )
  end
end

