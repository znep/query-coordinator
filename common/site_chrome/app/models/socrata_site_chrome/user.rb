module SocrataSiteChrome
  class User < Model
    extend FindExtensions

    attr_accessor :session_token

    def is_owner?(view)
      view.owner.id == self.id
    end

    def is_superadmin?
      flag?('admin')
    end

    def role_name
      @data['roleName']
    end

    def display_name
      @data['displayName']
    end

    def has_right?(right)
      rights && rights.include?(right.to_s)
    end

    def has_any_rights?
      rights.present?
    end

    # Attribute helpers in an attempt to move away from method_missing.
    def profileImageUrlMedium
      @data['profileImageUrlMedium']
    end

    # Helper methods for rights
    def can_create_datasets?
      has_right?('create_datasets')
    end

    def can_create_stories?
      has_right?('create_story')
    end

    def can_create_measures?
      has_right?('create_measures')
    end
  end
end
