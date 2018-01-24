require 'digest/sha1'

module SocrataLocaleAppUtils
  # Using SHA1 hashed versions of each project's API key to compare and
  # make sure that we are passing the right key for the right project
  LOCALEAPP_API_SHA1_HASHES = {
    'frontend'    => '131fd3637b02a3e6a2d3df2876004001241a335d',
    'storyteller' => 'd06490152734d914415715129906dcdc816dbcbc',
    'common'      => 'be872d6478b160725d25ba9229b61b2cbd861d75'
  }

  LOCALEAPP_API_KEY = {
    'frontend'    => ENV['LOCALEAPP_API_KEY'],
    'storyteller' => ENV['STORYTELLER_LOCALEAPP_API_KEY'],
    'common'      => ENV['COMMON_LOCALEAPP_API_KEY']
  }

  # Important to ensure that you are using the correct API key for a given project
  # The localeapp commands rely solely on the API key to determine which project to push / pull from
  # so this check helps to put some guardrails around accidentally executing something like:
  #
  #   `LOCALEAPP_API_KEY=$API_KEY_FOR_STORYTELLER localeapp push not_storyteller_en.yml`
  #
  def self.verify_api_key(project_name, api_key)
    api_key_digest = Digest::SHA1.hexdigest(api_key)
    expected_hash = LOCALEAPP_API_SHA1_HASHES[project_name]

    if expected_hash != api_key_digest
      puts "Expected: '#{project_name}' to have a Localeapp API key hash of: #{expected_hash}"
      puts "Are you sure you're using the right API key for this project?"
      puts "If you updated the API key in Localeapp, then please make sure LastPass is up to date and edit LOCALEAPP_API_SHA1_HASHES within this script to include:"
      puts "'#{project_name}' => '#{api_key_digest}'"
      exit(1)
    end
  end

  def self.get_path_to_en_yml(project_name, file_directory)
    case project_name
      when 'frontend'
        File.expand_path('../frontend/config/locales/en.yml', file_directory)
      when 'storyteller'
        File.expand_path('../storyteller/config/locales/en.yml', file_directory)
      when 'common'
        File.expand_path('../common/i18n/config/locales/en.yml', file_directory)
      else
        puts "Project name should be one of: #{SocrataLocaleAppUtils::LOCALEAPP_API_SHA1_HASHES.keys}"
        exit(1)
      end
  end
end
