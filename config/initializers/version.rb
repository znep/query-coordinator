require 'semver'

Rails.application.config.version = SemVer.find.format '%M.%m.%p'
