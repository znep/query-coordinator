class NewUxBootstrapController < ActionController::Base
  include CommonPhidippidesMethods
  include UserAuthMethods

  before_filter :hook_auth_controller

  def bootstrap
    # Check to make sure they have permission to create a page
    return render :json => {
      error: true,
      reason: "User must be one of these roles: #{ROLES_ALLOWED_TO_WRITE_TO_PHIDIPPIDES.join(', ')}"
    }, :status => :forbidden unless has_rights?

    # Grab the dataset metadata, for default page info and column/cardinality information
    if !dataset_metadata
      return render :nothing => true, :status => 404
    end


    # Grab the page 4x4s associated with this dataset id
    pages_response = page_metadata_manager.pages_for_dataset(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    case pages_response[:status]
    when '200'
      # If has page ids already, redirect to them
      pages = pages_response.try(:[], :body).try(:[], :publisher)
      if pages.present?
        default_page = nil
        if dataset_metadata[:defaultPage]
          default_page = pages.find { |page| page[:pageId] == dataset_metadata[:defaultPage] }
        end

        if default_page
          return redirect_to "/view/#{default_page[:pageId]}"
        else
          set_default_page(dataset_metadata, pages.last[:pageId])
          return redirect_to "/view/#{pages.last[:pageId]}"
        end
      end
    when '404'
      # do nothing - let it fall through
    else
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Dataset #{params[:id]} failed to return pages for bootstrapping.",
        :request => { :params => params },
        :context => { :pages_response => pages_response }
      )
      Rails.logger.error("Dataset #{params[:id]} failed to return pages for bootstrapping. " +
                         "#{pages_response[:status]} #{pages_response[:body]}")
      flash[:error] = I18n.t('screens.ds.new_ux_error')
      return redirect_to action: 'show', controller: 'datasets'
    end


    newux_page = create_new_ux_page(dataset_metadata)

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

    page_id = page_creation_result[:body][:pageId]

    # Set the default page to this page we just created.
    set_default_page(dataset_metadata, page_id)
    return redirect_to "/view/#{page_id}"
  end

  private

  include CardTypeMapping
  require 'set'
  require 'json'

  # An arbitrary number of cards to create, if there are that many columns available
  MAX_NUMBER_OF_CARDS = 10

  def create_new_ux_page(new_dataset_metadata)
    # Keep track of the types of cards we added, so we can give a spread
    added_card_types = Set.new
    skipped_cards_by_type = Hash.new { |h, k| h[k] = [] }

    cards = new_dataset_metadata[:columns].map do |column|
      unless Phidippides::SYSTEM_COLUMN_ID_REGEX.match(column[:name])
        card_type = card_type_for(column, dataset_size)
        if card_type
          card = PageMetadataManager::CARD_TEMPLATE.deep_dup
          card.merge!(
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

    if cards.length < MAX_NUMBER_OF_CARDS
      # skipped_cards is an array of arrays, grouped by card type
      skipped_cards = skipped_cards_by_type.values
      # Find the card type with the most cards (to facilitate the zip operation)
      most_cards_of_this_type = skipped_cards.max_by(&:length)
      if most_cards_of_this_type.present?
        # Interleave the cards of different types, for the best variety
        interleaved_cards = most_cards_of_this_type.zip(*skipped_cards.select do |cards|
          cards != most_cards_of_this_type
        end).flatten(1).compact
        # Fill out the rest of the cards for the page
        cards = cards.concat(interleaved_cards.first(MAX_NUMBER_OF_CARDS - cards.length))
      else
        cards
      end
    else
      cards = cards.first(MAX_NUMBER_OF_CARDS)
    end

    {
      'datasetId' => new_dataset_metadata[:id],
      'name' => new_dataset_metadata[:name],
      'description' => new_dataset_metadata[:description],
      'cards' => cards
    }
  end

  def set_default_page(new_dataset_metadata, page_id)
    # Set the last page to be the default page
    new_dataset_metadata[:defaultPage] = page_id
    # Send a request to phidippides to set the default page.
    result = phidippides.update_dataset_metadata(new_dataset_metadata)
    if result[:status] != '200'
      # It's more important to do a redirect than it is to save the default page, so just log it.
      Rails.logger.warn('Error saving new default page for ' +
                        "dataset_id=#{params[:id]}, page_id=#{page_id}: #{result}")
    end
  end

  def dataset_size
    # Get the size of the dataset so we can compare it against the cardinality when creating cards
    @dataset_size ||= begin
      JSON.parse(
        CoreServer::Base.connection.get_request("/id/#{params[:id]}?%24query=select+count(0)")
      )[0]['count_0']
    rescue CoreServer::Error => e
      Rails.logger.error('Core server error while retrieving dataset size of dataset ' +
                         "(#{params[:id]}): #{e}")
      nil
    end
  end

  def dataset
    View.find(params[:id])
  end

end

