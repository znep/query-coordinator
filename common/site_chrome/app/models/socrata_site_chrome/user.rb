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

    def is_administrator?
      role_name == 'administrator'
    end

    def is_designer?
      role_name == 'designer'
    end

    def is_publisher?
      role_name == 'publisher'
    end

    def is_publisher_stories?
      role_name == 'publisher_stories'
    end

    def is_editor?
      role_name == 'editor'
    end

    def is_editor_stories?
      role_name == 'editor_stories'
    end

    def is_viewer?
      role_name == 'viewer'
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
  end
end
