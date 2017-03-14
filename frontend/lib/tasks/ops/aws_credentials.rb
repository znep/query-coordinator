require 'inifile'

class AwsCredentials
  CREDS_FILE=File.expand_path('~/.aws/credentials')

  def self.present?
    return File.exists?(CREDS_FILE)
  end

  def self.has_credentials_for?(environment)
    creds = IniFile.load(CREDS_FILE)
    present? && creds.has_section?(environment)
  end
end
