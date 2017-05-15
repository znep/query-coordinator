## Option 1 - IE through a Virtual Machine

1. Download & install Virtualbox here: https://www.virtualbox.org/wiki/Downloads

2. Download a Windows VM here: https://developer.microsoft.com/en-us/microsoft-edge/tools/vms/
We typically support the latest version of all browsers, and at the time of this writing means IE 11

3. Open up the Windows VM with Virtualbox

4. Look for the Notepad program in the Start Menu, and right click to Run as Administrator

5. Within Notepad, select File → Open, and browse to `C:\Windows\System32\drivers\etc`

6. Open up the `hosts` file (you may have change the file type next to `File name` to `All Files` from `Text Documents (*.txt)`

7. Add the following line to the hosts file and save
```
10.0.2.2 localhost
```

8. Restart the VM for the changes to take effect

9. Now you should be able to open up IE and browse to https://localhost assuming your local stack is running on your host machine without issues

## Option 2 - Use IE Test Machines
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

## Troubleshooting

### Problem: Certificate errors in IE preventing content from loading properly

### Solution: The SSL certs that came with the project are most likely expired, and you may have to generate new ones, which can be done by the following commands.
```
cd ~/Developer/Socrata/frontend
dev-server/ssl/create-ca
dev-server/ssl/create-cert
```

After the certs are generated, you’ll need to restart:

- nginx
- frontend rails server
- frontend webpack server

