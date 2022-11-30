---
layout: post
title: A silly side quest in debugging
---

Over the past few months I've been trying to set up my raspberry pi as a home linux server. I used to run a server off my old laptop but I decided it would be a bit more fun to try to set up a raspberry pi instead. It's smaller and draws less power, and would let me play around with things like a camera or other peripherals.

However, I ran into many problems. First, my comcast xFi modem has two ethernet ports. I plugged one into my desktop and the other into my dd-wrt router. However, I was not able to find the router on the network. I checked the router and saw that the lights were on. I plugged my computer directly into it and wasn't able to find it on the network using nmap. So I reset the settings using the [30-30-30 method](https://wiki.dd-wrt.com/wiki/index.php/Hard_reset_or_30/30/30) but it still wasn't visible. I tried to figure this out on and off in my free time over the course of several weeks. Evenutually I looked closer into the lights and noticed that the router's light would turn on but then turn off momentarily every few minutes. That was odd, so I looked at the power supply and noticed that the power supply was only rated for 12V 0.5A. The original power adapter is rated for 12V 2.5A. I bought a replacement on Amazon and then I was able to finally power it on.

After configuring the router, I then needed to configure my raspberry pi. I had this raspberry pi for many years now, but I hadn't used it in a while. I plugged it into the router and was able to ssh in. But the next time I tried to ssh in, I couldn't. Also, my partner complained that the wifi was no longer working. That was really weird. So I plugged the raspberry pi into my monitor and tried to debug it. I noticed that `ip a` would show that the `eth0` interface had *two* ip addresses, `10.0.0.1` and `10.0.0.59`. This was a problem because `10.0.0.1` was the IP of the modem. So somehow the modem and the pi were both asserting they were `10.0.0.1` and that would cause everything to break.

Fixing this `10.0.0.1` problem took another couple days. After booting, the pi would have both `10.0.0.1` and `10.0.0.59`. However, after running `ifdown eth0` and `ifup eth0`, it would only have `10.0.0.59`. There was nothing in `/etc/network/interfaces` that would indicate that `eth0` should have a static ip at all. I looked in `/var/log/daemon.log` and I saw the line `raspberrypi avahi-daemon[378]: Joining mDNS multicast group on interface eth0.IPv4 with address 10.0.0.1` so I tried disabling `avahi-daemon` but that didn't work either.

Looking further in `/var/log/daemon.log`, I saw that it was in fact the kernel that was configuring the ip to be `10.0.0.1`, before e.g. dhcpcd would acquire `10.0.0.59`. I saw the lines

```
Nov 28 19:24:36 raspberrypi kernel: [    8.734282] IP-Config: Guessing netmask 255.0.0.0
Nov 28 19:24:36 raspberrypi kernel: [    8.744701] IP-Config: Complete:
Nov 28 19:24:36 raspberrypi kernel: [    8.755166]      device=eth0, hwaddr=b8:27:eb:8a:8a:70, ipaddr=10.0.0.1, mask=255.0.0.0, gw=255.255.255.255
Nov 28 19:24:36 raspberrypi kernel: [    8.765833]      host=10.0.0.1, domain=, nis-domain=(none)
Nov 28 19:24:36 raspberrypi kernel: [    8.776548]      bootserver=255.255.255.255, rootserver=255.255.255.255, rootpath=
```

Searching for these strings confirmed that this was happening in the kernel. I searched `/var/log/kern.log` for `10.0.0.1` and found this line:

```
Nov 28 19:24:36 raspberrypi kernel: [    0.000000] Kernel command line: coherent_pool=1M 8250.nr_uarts=0 snd_bcm2835.enable_compat_alsa=0 snd_bcm2835.enable_hdmi=1 bcm2708_fb.fbwidth=1824 bcm2708_fb.fbheight=984 bcm2708_fb.fbswap=1 vc_mem.mem_base=0x3ec00000 vc_mem.mem_s
ize=0x40000000  dwc_otg.lpm_enable=0 console=ttyS0,115200 console=tty1 root=PARTUUID=e257a7fe-02 rootfstype=ext4 elevator=deadline fsck.repair=yes rootwait ip=10.0.0.1
```

Huh, what's a "Kernel command line?" It was unclear how exactly it was set, but it seemed like the culprit. After searching google, I found a [stackoverflow answer](https://stackoverflow.com/questions/60412426/how-to-send-kernel-command-line-parameter-in-raspbian) indicating that it could be set using `/boot/cmdline.txt`. Sure enough, I had added the `ip=10.0.0.1` parameter, years ago, likely to connect over direct ethernet to my laptop. Once I removed this parameter, everything worked as intended again.

With my router working, and raspberry pi working, then I had to expose the rasperry pi to the world. In order to do this, I tried to set up port forwarding on my modem. This is typically a simple operation. However, Comcast makes this nigh impossible. First, I opened the router's web interface to add a port forward. I am greeted with this:

![image1](https://user-images.githubusercontent.com/6463052/204682828-b34ecbde-e86e-495e-a50f-6d7dbf90ece0.PNG)

Ok... I don't like it but fine, I'll go along with it.

![image](https://user-images.githubusercontent.com/6463052/204682768-6d02c369-f3e2-481c-9dea-fe2a94695a4b.png)

Are you kidding me? This is so dumb. At this point I gave up for the day. The next day, I downloaded the app and tried to add a port forward. This was not intuitive but I managed to get it to appear to work. However, the change would not take affect for about 15 minutes, during which time I had no idea how to debug. I ended up reading the forum and read dozens and dozens of complaints with this modem. 

> They're going on 3 generations of hardware, using the same backend server/app interface that apparently isn't available all the time, or that corrupts the gateway config to the point where the next option is replacement.
> They'll say here: Have someone else's problem (perhaps refurbished, perhaps not).  We'll ship it to you....is their solution. Perhaps it also provides an opportunity to up-sell services, so the time and expense is worth more than actually fixing the problem.  You might even think "SuperSonic" is an engineering term, and that for some reason it's faster than any other DOCSIS 3.1 modem, and that perhaps they can even actually deliver the speed to your location using the infrastructure that is in your area (That's a BIG IF). 
> Any other product manager would be raising hell and suing the company that manufactured it.  They surely wouldn't double down and buy another bug ridden generation of hardware from them.
> Bridging a customer owned cable modem and pointing it at a firewall that can split your networks is the way to go.  Then you isolate your exposed ports/gamer system from the rest of your equipment.  You're going to want that system on an Ethernet port anyway.  Do your own WiFi for everything else (access points/mesh/whatever).  Then you configure everything locally, have 'pretty good' security, and you'll never have the problem again.
> Advice is cheap.  Cheaper than $14/month too.
> Xfinity might not think that's fair, but it's the truth. 

> Port forwarding remains seriously broken. Has been for over a year. Pathetic.  I have spent 5 hours with 5 different Xfinity tech support people over the last 2 days and still no joy. The current problem for me (and, yes, there have been others in the past) is that I cannot DELETE ports forwarded previously, configured on devices no longer on my LAN. From my computer, I log in to my gateway (192.168.1.1) and select Port Forwarding. It says I must go to an Xfinity web site to configure port forwarding. So I go there and it says I can't configure the ports from my computer...I have to download an app to my phone to do that. I guess Comcast assumes everyone has a phone. How are folks that do not have a smart phone supposed to configure their modem? Anyway, I have a phone, so I download the app and follow the instructions, but the app does not work correctly for devices no longer on the LAN. The app will not allow any of the forwarded ports to be deleted or edited. So it is impossible to use these ports on equipment that is on my LAN today. The Xfinity article describing the process has a screen shot showing DELETE buttons for devices no longer on the LAN, but in the real world, the DELETE button is not there on my phone. Only an EDIT button...which does not work for devices no longer on the LAN. Totally [EDITED: Language]. ([Link](https://forums.xfinity.com/conversations/your-home-network/port-forwarding-not-working-still/62e98dc72777cb750463f8cb?commentId=63471d572ff2c6658900bf9c))

Anyways, now my app doesn't even let me edit any of the existing port forward configurations. At least they seem to work, but I guess I'm stuck with only ports 22, 80, and 443.

It was a decent exercise to get everything set up, but really it should not have taken so long. I feel as though there is a long-standing trend in technology to make everything dumbed-down and user-unfriendly. This makes many things in my life harder. Pretty much everything with the xfinity modem was terrible. I don't know why they decided to make port forwarding through their service instead of local like every other router. Also, I wish there was an indication on the router that there was not enough current (like there is on the raspberry pi), but I guess NetGear didn't expect me to plug in a 10 year old linksys wall wart thinking that it would be enough power.

The raspberry pi kernel command line text file reminds me that documentation is important, and also that debugging something can often be harder than just starting over because I lack the context. This time around, I'll be keeping a README of all the steps I've taken to set up this server.

