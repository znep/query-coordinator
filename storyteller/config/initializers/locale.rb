# Load all locale files from /common/i18n/config/locales
I18n.load_path += Dir[Rails.root.join('..', 'common', 'i18n', 'config', 'locales','*.yml')]
