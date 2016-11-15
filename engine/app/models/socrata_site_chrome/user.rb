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

    def role_name
      @data['roleName']
    end

    def display_name
      @data['displayName']
    end

    def has_right?(right)
      self.rights && self.rights.include?(right)
    end

    def can_approve?
      has_right?(UserRights::MANAGE_APPROVAL) || (Approval.find[0] || Approval.new).is_approver?(self)
    end

    # Attribute helpers in an attempt to move away from method_missing.
    def profileImageUrlMedium
      @data['profileImageUrlMedium']
    end
  end
end
