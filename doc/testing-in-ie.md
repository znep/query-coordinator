Add the static IP address by which your machine is known when it is connected
to the same network that the IE test machines are using, as an alias in the
Internal -> Current Domain -> Aliases admin page. You'll need to do this on
your dev machine, not while using IE.

When adding aliases to the admin page, you may add as many as you like using
commas to separate each value but do not use spaces or you're gonna have a
bad time.

If you'd visited any page already in IE and been subsequently redirected
to www.socrata.com, you'll have to close all instances of IE and relaunch the
browser. If you still have trouble, try navigating to a specific page such as
https://your.ip.add.ress/login to see if you can login.

If you still experience pain, make sure that the URL (or "shortcut" in IE
parlance) that you're clicking on reflects the expected IP address for your dev
machine. If it doesn't, you may have to add that IP address as an additional
alias.
