# Temporary module for switching methods/templates between v4 and v3
# TODO/v4: Remove me when we delete v3. You'll also want to move all the
# v4_.* templates over the originals.
module NewChromeMethodProxy
  def method_missing(name, *args)
    # Don't want to define any unwanted methods
    raise ActionController::UnknownAction unless name.to_s =~ /^v4_(.*)/ && self.respond_to?($1)

    # Define a new method that calls the old one with the new ERB
    # Using send :define_method because it's private
    self.class.send(:define_method, name) { send($1) }
    # Then call the method
    send name
  end

  def respond_to?(sym)
    return sym.to_s =~ /^v4_(.*)/ || super(sym)
  end
end
