---
title: "Your dependency tree is too big to read. Here's what to watch instead."
description: "Dependency trees have gotten too big for anyone to review by hand. A look at what scanners actually catch, what they don't, and a zero-cost RSS-based early-warning setup."
pubDate: 2026-11-17
tags: ["security", "tooling"]
heroImage: "./images/software-dependencies.png"
heroImageAlt: "Pixel-art illustration of a sprawling tree made of npm package names like react, lodash and webpack, captioned 'TL;DR your dependency tree'"
---
Run `npm ls --all` on almost any real-world JavaScript project and watch the terminal scroll for a while. That's not a bug. That's the actual shape of the thing you shipped. [An InfoWorld piece making the rounds this month](https://www.infoworld.com/article/4225043/software-dependencies-are-running-away-from-us.html) puts it plainly: nobody actually reviews the whole dependency graph anymore, because nobody possibly can.

That framing is worth sitting with. You audit `package.json`, maybe. You do not audit the forty transitive packages a logging library pulled in, or the forty behind those. The failure mode is obvious once you say it out loud: relying on every maintainer, at every level of that chain, to notice and fix their own CVEs. This comes neatly packaged with a line that's bound to end up in every slide deck about this for the next year: "Hope is not a strategy." It isn't. It's also, as far as I can tell, roughly what most teams are running on right now, whether they'd admit it or not.

The accelerant is AI coding assistants that happily suggest `npm install whatever-looks-right` faster than anyone can check what it actually pulls in. That tracks with what I've watched in my own editor: the suggestion arrives, it solves the immediate problem, and the provenance of the five sub-dependencies it just added gets checked approximately never.

## What's actually good here

The tooling genuinely has improved, and it's worth saying so before getting cynical. A few concrete options, and they're real, not vaporware:

- **Dependabot** and **Renovate** will open a PR when a dependency has a known fix available, which turns "someone has to remember to check" into "something shows up in your inbox." Neither one reads your code to see if the upgrade actually breaks anything (that's still on you) but they do solve the "nobody noticed" half of the problem.
- **OSV.dev**, Google's open vulnerability database, aggregates advisories across ecosystems (npm, PyPI, Go, crates.io, and more) in a machine-readable format, and `npm audit` and similar tools increasingly draw from feeds like it rather than maintaining their own siloed lists.
- **Checkmarx** and **Snyk** scan a repo's full resolved dependency tree, not just the top-level manifest, and flag known-vulnerable transitive packages, which is the actual problem, since the top-level manifest was never where the risk was hiding.
- **HeroDevs** sells continued patches for packages whose upstream maintainer has walked away: its CEO calls the company "the nursing home of the internet," which is blunt enough that I'll just repeat it rather than improve on it. **Chainguard** takes a different angle: stripped-down, nightly-rebuilt container base images that shrink the attack surface at the OS layer instead of chasing every application-level CVE one by one.
- You also can't just stop at the application dependency tree: the container you shipped it in has its own. `FROM node:20` drags in whatever Debian packages that image's maintainers baked in on whatever day they built it, and those get stale too. **Trivy**, **Grype**, and Docker's own **Docker Scout** will scan an image layer by layer and tell you the base OS has a CVE your `package.json` was never going to mention, because it isn't your code's problem until someone's exploiting the kernel underneath it.

## What's still rough

None of this closes the actual gap. A scanner can tell you a transitive dependency has a known CVE; it cannot tell you whether upgrading past it breaks your build, and "upgrade and hope it still works" is just "Hope is not a strategy" wearing a different hat. The real bottleneck is honest and unglamorous: the fix exists, but testing whether it's safe to apply is still manual, slow, and skipped under deadline pressure.

## A cheap, boring fix: put the advisories in an RSS reader

You don't need a platform to know when something in your stack gets a CVE: it can be as simple as a Slack notification, and of course remembering to read the message.

There's something a little funny about reaching for RSS, specifically, to fix a 2026 problem. It's 90s technology that was already being declared dead around the time Google Reader got shut down over a decade ago, and here it is, still the most reliable plumbing for "tell me the instant something changes," because nobody's broken it and nobody's locked it behind an API key yet. 

And you don't even need to open an RSS/feed reader. Slack has a built-in `/feed subscribe <url>` command that posts new items from an RSS/Atom feed straight into a channel: point it at a security-advisories feed and a vulnerability lands in `#security-alerts` the moment it's published, no separate app, no polling script. For feeds that don't play nicely with Slack's native command (rate limits, auth headers, whatever), a small scheduled job that fetches the feed and POSTs new entries to an incoming webhook does the same job in about twenty lines of code. Either way, the advisory shows up where your team already looks, not in a dashboard nobody has open.

Cloudflare launched something called **Zero Wire** on November 3, 2026, a hub on Cloudflare Radar that writes up selected critical CVEs in plain language, sorted into "Needs attention" and "Reference." It comes with its own feed at `radar.cloudflare.com/zero-wire/rss` (not buried in the general Cloudflare blog feed, an actual dedicated one), which makes it about as close to a plug-and-play first subscription as this list gets. Notable recent entries include PHP2Shell, Node2Shell and Java4Shell; is this starting to become one of those "spot the pattern" questions we got in school?

None of this is a dependency scanner. It's a wire service for the stuff you'd otherwise find out about three weeks late, in a Slack message, after it already mattered.

## Where that leaves you

No one's pretending this is solved, and neither will I. Scanners catch the known stuff. SBOMs (software bills of materials, in formats like CycloneDX or SPDX) at least let you answer "do we even have this package anywhere" during the next incident. An RSS reader pointed at the right advisories buys you early warning instead of a surprise. None of it buys you a dependency tree you can read end to end, because that tree stopped being human-readable around the same time `npm install` started pulling in hundreds of packages for things that used to be a dozen lines of code. The honest advice is smaller than a product pitch: pick two or three feeds and actually read them.