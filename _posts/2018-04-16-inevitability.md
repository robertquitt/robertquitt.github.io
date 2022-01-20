---
layout: post
title: Inevitability
---

# Why Tech in CS Orgs is Bound to Continually Fail, and How to Fix That

I've been working with the tech stacks for UC Berkeley IEEE and UC
Berkeley CSUA for a while now, and something I've been thinking about is
the inevitable failure of the technology in these organizations. Don't
take this the wrong way, there are great, smart people working in these
clubs. There are people who I really respect and admire who work on
server administration tasks. We care about the continued operation and
success of our organizations.

The problem is that, *every 4 years, no one is around anymore*. Let me
repeat that: no one who initially set up a piece of technology 4 years
ago is around to maintain, develop, debug, etc.

We rely on our own time and ingenuity to understand the intentions of the
original workers. The main problem is a lack of documentation and
information for maintainers. This leads to headaches and digging through
configs, trying to understand design decisions and oftentimes convoluted
configuration.

For example, often, the sequence of commands used to fix a problem in a
system is used over and over. Most of the time, this is transferred by
word-of-mouth or through instant messaging (FB messenger, Slack, etc.)

Another example is instructions on how to set something up. This is a
problem for two reasons. Firstly, it makes it harder to rebuild if it
breaks completely or gets wiped. Secondly, it makes it harder for the
next generation of maintaners to work on.

## Solutions

I think it's useful to look at how other organizations have solved this problem.
One organization that I would consider to be doing well is the OCF.

Firstly, they have a number of alumni who are active on their IRC/Slack/Discord/Matrix chat.
They have a substantial amount of documentation, and have a culture of linking to that documentation.

Why has the OCF solved these problems while the CSUA hasn't? For the OCF, there are people who depend on their infrastructure (students for printing, other student orgs for web hosting, CI/CD, software mirrors).
This gives them a responsibility to keep their organization alive and knowlegable.
Compare that to CSUA or IEEE, whose technology stacks are mostly self-serving (email lists, website, etc).

The OCF is dedicated to technology. The CSUA is not, at least not to the same extent. Most people who join the CSUA don't join it for the technology. However, there are a lot of very technically skilled people in the CSUA, who could certainly learn the ropes. And it's possible for the CSUA to have a sustainable root staff.

My recommnedation for the CSUA is as follows:
* Make sure alumni are included in root discussions. This could mean directly inviting them to discord, bridging discord and slack, and/or including them in root staff meetings.
* Try to avoid private communications, unless necessary. The more eyes, the better. Additionally, the communications should be searchable, such as via a discord search, or searching emails. Slack has the problem of 10k most recent messages are visible.
* Ensure new root staff are being trained. Even if they don't do much work, having them around is good for keeping the institutional knowledge around. Plus, the more people you train, the less work has to be done per person (on average).
* Continue to use and update documentation. In response to this post years ago, I decided to attempt to document all the technical details of CSUA in [the CSUA root wiki](https://github.com/CSUA/csua-utils/wiki). There are many details left to fill in, but I implore more people to take up this task.

## Why is it even important?

I had an errant thought--what if I'm wrong?

This post is written with the premise that having the technology stack of these orgs failing is a strictly bad thing.
Maybe it isn't strictly bad.

When technology begins to fail so badly that the current generation needs to replace them, then newer practices and technology can be adopted.
The staff of the current generation could raze the infrastructure and build from zero.
This way, they could learn how to architect a new system, or work with an up-and-coming technology.
When technology is failing, and there isn't a strong need to fix it, could be an indication that the technology is no longer needed.

For example, in the CSUA, hardly anyone uses slack anymore, so the organization has primarily switched to discord.
In IEEE, the old Ruby on Rails website was deprecated in favor of a ReactJS one.

But maybe I'm right. While change can lead to great benefits, it can also go poorly.
For example, in Fall of 2017, CSUA tried to switch over to a NodeJS+ReactJS-based website in lieu of the old and current Django-based website.
This backfired because there weren't enough people familiar with developing in NodeJS and ReactJS, and the person who spearheaded this switch left the organization.

There can be a heavy cost to setting up new infrastrure.
The skills of the staff should be taken into consideration.
Part of the reason that Django was chosen as the web framework for CSUA is that Python is part of the introductory CS cirriculum at Berkeley.
Just knowing Python isn't enough to learn web development, but at least it's one less thing to learn.
Compare that to learning all the nuances of backend JS, with callbacks, ECMAscript standards, toolchains, etc.

So it seems like the strategy is to choose a technology that will be useful and maintainable for as long as possible. If that technology no longer serves a good purpose, and it can be replaced by a clear winner, then it should be.

### Case Study: 2014 RAID failure, or, the death and rebirth of CSUA tech

In 2014, the main RAID which housed all of CSUA's ftp, nfs, and mail crashed. It was a RAID 6 setup, so 2 disks had to go offline for this to happen. After the disk array went offline, it should have still been possible to recover some data. However, the disks were instead reformatted with a new filesystem, causing the data to become irrecoverable. This could have been avoided had there been alerting on the RAID health, and the data could still have been recovered had alumni been consulted on the matter. This type of event must be avoided. Decades of historical data was lost.

https://www.facebook.com/groups/csuahosers/permalink/10152411168169856/
https://www.facebook.com/groups/csuahosers/permalink/10152377861569856/

The CSUA has been, and will continue to be run by technically inexperienced undergraduates. Occasionally someone with great UNIX powers comes by and makes many things better, like mark64. But without proper maintenance, the infrastructure will fall into ruin once more, unless people make active efforts to keep things running smoothly.

## Edit history

* 4/16/18: Initial writing
* 1/19/22: More writing
