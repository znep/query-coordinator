require 'digest/sha1'

class CoreSession
  include ActionDispatch::Session::StaleSessionCheck

  attr_accessor :user_id, :expiration, :salt, :signature

  def initialize(by, env)
    @by = by
    @env = env
    @loaded = false
  end

  def to_s
    if valid? && loaded?
      Base64.encode64("#{user_id} #{expiration.to_i} #{salt} #{signature}").gsub(/\n/, '')
    else
      ""
    end
  end

  def size
    to_s.size
  end

  def valid?(force_load: false)
    return false if FeatureFlags.derive[:core_managed_session]

    load!(force_load: force_load)
    false unless loaded?
    valid_expiration? && valid_signature?
  end

  def user_id
    load!
    @user_id
  end

  def user_id=(value)
    @user_id = value
    update_signature_if_otherwise_valid
  end

  def expiration=(value)
    load!
    @expiration
  end

  def expiration=(value)
    @expiration = value
    update_signature_if_otherwise_valid
  end

  def salt
    load!
    @salt
  end

  def salt=(value)
    @salt = value
    update_signature_if_otherwise_valid
  end

  def clear!
    @user_id = nil
    @expiration = nil
    @salt = nil
    @signature = nil
    @loaded = true # Needed so we save an empty core session back
  end

  # For tests
  def pretend_loaded
    @loaded = true
  end

private

  def valid_expiration?
    (expiration > Time.now) unless expiration.nil?
  end

  def valid_signature?
    load!
    loaded? && (@signature == computed_signature)
  end

  def update_signature_if_otherwise_valid
    if !user_id.blank? && expiration && !salt.blank?
      @signature = computed_signature
      @loaded = true
    end
  end

  def computed_signature
    secret = Rails.application.secrets.core_session_secret

    Digest::SHA1.hexdigest("#{secret} #{user_id} #{expiration.to_i} #{salt}")
  end

  def loaded?
    return false if FeatureFlags.derive[:core_managed_session]

    @loaded
  end

  def load!(force_load: false)
    if FeatureFlags.derive[:core_managed_session]
      raise "Should not be using Core Session if core managed sessions are enabled"
    end

    if loaded?
      return unless force_load
    end

    stale_session_check! do
      core_session = @by.send(:load_core_session, @env.try(:clone))
      unless core_session.blank?
        parts = core_session.split
        if parts.length == 4
          @user_id = parts[0]
          @expiration = Time.at(parts[1].to_i)
          @salt = parts[2]
          @signature = parts[3]
        else
          @user_id = nil
          @expiration = nil
          @salt = nil
          @signature = nil
        end
        @loaded = true
      end
    end
  end

  def self.unmangle_core_session_from_cookie(cookie_data)
    core_data  = cookie_data.gsub('"', '') if cookie_data

    if core_data.present?
      # Screw you, Commons Codec. Now that we're using a nice, URL-safe encoding,
      # it appears that the codec doesn't properly pad the Base64 text to be a
      # multiple of 4 characters.
      extra_equals_necessary = (4 - (core_data.length % 4)) % 4
      return Base64.decode64(core_data+ ('=' * extra_equals_necessary))
    else
      return nil
    end
  end
end
