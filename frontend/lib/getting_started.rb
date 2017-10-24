# coding: utf-8

# https://socrata.atlassian.net/browse/EN-19396
# Takes a user, and exposes a list of GettingStartedPanel objects. This object
# is defined at the bototm of the file, and is a thin wrapper for the fields we
# would like to render on the User Profile.
module GettingStarted
  PRIORITY = %w(manage_users create_datasets view_others_datasets)

  PANELS_FOR = {
    'manage_users' => %w(manage_user_accounts featuring_content connecting_external_data developer_resources),
    'create_datasets' => %w(publishing_data visualizing_data getting_to_know_datasets),
    'view_others_datasets' => %w(getting_to_know_datasets discovering_and_managing_your_assets filtering_datasets),
    'default' => %w(getting_to_know_datasets filtering_datasets navigating_the_data_catalog)
  }

  def self.panels_for(user)
    highest_user_right = self.highest_user_right(user)
    PANELS_FOR[highest_user_right].map(&Panel.method(:new))
  end

  private

  def self.highest_user_right(user)
    user_rights = user&.rights || []
    PRIORITY.find(&user_rights.method(:include?)) || 'default'
  end

  # Represents a 'Getting Started' panel with title, description, and link
  class Panel
    attr_reader :title, :description, :link

    LINK_FOR = {
      'manage_user_accounts' => 'https://support.socrata.com/hc/en-us/articles/202950288-Manage-user-accounts-and-assign-roles',
      'featuring_content' => 'https://support.socrata.com/hc/en-us/articles/115005683108-Featured-Content-for-the-Data-Catalog',
      'connecting_external_data' => 'https://support.socrata.com/hc/en-us/articles/223722647-Using-the-Catalog-Connector-to-Federate-and-Connect-External-Assets',
      'developer_resources' => 'https://dev.socrata.com/',
      'publishing_data' => 'https://support.socrata.com/hc/en-us/articles/202950728-Guide-to-Publishing-Data',
      'visualizing_data' => 'https://support.socrata.com/hc/en-us/articles/115000813847-Navigating-the-new-visualization-canvas',
      'getting_to_know_datasets' => 'https://support.socrata.com/hc/en-us/articles/221691947-Socrata-Primer-a-dataset-s-landing-page',
      'discovering_and_managing_your_assets' => 'https://support.socrata.com/hc/en-us/articles/218053527-Asset-List-and-Asset-Inventory-Overview',
      'filtering_datasets' => 'https://support.socrata.com/hc/en-us/articles/202950808-Creating-a-Filtered-View',
      'navigating_the_data_catalog' => 'https://support.socrata.com/hc/en-us/articles/202949778-Navigating-the-dataset-catalog'
    }

    I18N_SCOPE = 'screens.profile.getting_started'

    def initialize(key)
      @title = "#{I18N_SCOPE}.#{key}.title"
      @description = "#{I18N_SCOPE}.#{key}.description"
      @link = LINK_FOR[key]
    end
  end
end
