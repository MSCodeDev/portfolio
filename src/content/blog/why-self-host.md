---
title: "The Production Environment Where Breaking Things Is Encouraged"
description: "The case for self-hosting, for developers specifically: a sandbox with no incident review, and the one place left to misconfigure a reverse proxy without a postmortem."
pubDate: 2026-11-16
tags: ["self-hosting", "homelab"]
heroImage: "./images/why-self-host.png"
---
Self-hosting gets pitched, most often, as a privacy move: run your own Nextcloud instead of handing photos to Google, run your own Bitwarden instead of trusting a third party with your passwords. That's a legitimate reason to do it. It's also not the reason a software developer, specifically, should care — plenty of people who will never read a Dockerfile have perfectly good privacy reasons to self-host. The case for developers is narrower and more self-interested: it's one of the only places left where you get to run real, production-shaped infrastructure and be the only person who suffers when you get it wrong.

## The infrastructure your job protects you from

If you work on a team of any size, there's a good chance someone else owns the reverse proxy config, the DNS zone, the TLS renewal, the backup schedule, and the alerting rules. You write application code and a platform team or a managed PaaS absorbs the rest. That's good for shipping features. It's bad for actually understanding the stack your code runs on, because "it's handled" and "I understand how it's handled" are different things, and only one of them survives an outage at 2am when the platform team is asleep too.

Running a few services at home — even two or three — puts you back in contact with the primitives a PaaS quietly hides: a reverse proxy like Nginx or Traefik terminating TLS and routing by hostname, a DNS record actually resolving (or not), a container restarting in a crash loop because you forgot an environment variable, a disk that ran out of storage space. None of this is exotic. It's the same vocabulary as a staging environment at work. The difference is nobody wrote the Terraform for you first.

## A sandbox with no incident review

Here's the part that's genuinely different from a work environment, and it's the strongest reason to do this rather than just read about it: at home, you own the entire blast radius, and nobody is filing a postmortem. Misconfigure a firewall rule at work and you've got a security incident with a timeline and a Slack channel full of people asking questions. Misconfigure one at home and you've got a Tuesday evening. You can break DNS for your own household, fix it, and the only cost is whoever's streaming video complaining that the internet is "down" (it isn't, your Pi-hole just nose dived). That's a much cheaper way to learn what actually happens when a DNS resolver dies than finding out in an incident channel with your name on the change.

## A testbed before a recommendation

There's also a narrower, more practical use: self-hosting is where you try a new open-source tool before you'd ever suggest it at work. I read the [selfh.st](https://selfh.st) newsletter every week specifically for this — it's a steady drip of self-hosted tools, most of which I will never need, a few of which are worth an evening to actually stand up and poke at. Running something yourself, even badly, tells you things a GitHub README won't: how it behaves on first boot, what its default auth looks like, whether the Docker image is maintained or three years stale. That's cheap due diligence you can only do by actually running the thing.

## What this doesn't get you

None of this is free, and it's worth saying plainly: self-hosting is not inherently virtuous, and it is not risk-free. It costs ongoing time — the kind that shows up as "I should really update that container" six months after you stopped thinking about it. It costs a small, continuous amount of electricity if you're running hardware around the clock. And it carries a specific, recognizable risk: the night your home DNS goes down and nothing in the house resolves, including the smart lights, at 11pm, because you built every household system on top of a hobby project. Cost savings versus a SaaS subscription are real over a long enough horizon, but only if you're honest about counting your own time at something above zero. And if you start to enjoy it, it becomes hard to stop at a few containers. There is always room for one, or twenty, more. And if not, time to upgrade your hardware. See where this is going? 

## The actual first step

Skip the multi-service dashboard-of-dashboards setups you'll see in homelab subreddits — that's a second-year project, not a first one. A reasonable on-ramp:

1. **Docker Compose** as the on-ramp, because it gives you reproducible, disposable services instead of hand-installed packages you'll never cleanly remove.
2. One genuinely useful first service. **Pi-hole** or **AdGuard Home** for DNS-level ad blocking is the classic choice because the payoff is immediate and visible. **Uptime Kuma** is a good alternative first project if you'd rather start with something that watches other things instead of gatekeeping your network. **Vaultwarden** (a Bitwarden-compatible password manager) and **Immich** (a self-hosted Google Photos alternative) are two more worth a look — both replace a subscription you're probably already paying for, so the payoff shows up on your bank statement, not just your terminal.

A minimal starting point looks roughly like this:

```yaml
# docker-compose.yml
services:
  pihole:
    image: pihole/pihole:latest
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"
    environment:
      TZ: "Africa/Johannesburg"
    volumes:
      - ./etc-pihole:/etc/pihole
    restart: unless-stopped
```

What still trips people up, consistently: exposing anything to the public internet safely (I find it best to keep it local only, and use a VPN when you need to access it remotely); backups, which everyone skips right up until the drive holding three years of photos dies; and  keeping it all up-to-date.

## The honest verdict

Self-hosting won't make you a better developer by itself, and anyone who tells you it's purely rational once you count the hours is skipping the math. What it reliably gives you is hands-on friction with the same categories of problem — routing, certificates, auth, backups, monitoring — that your job usually lets you treat as someone else's config file. You don't need a rack. You need one old office desktop or laptop, one weekend, and a tolerance for your own outages.