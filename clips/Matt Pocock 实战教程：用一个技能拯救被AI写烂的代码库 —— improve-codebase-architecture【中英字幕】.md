---
title: "Matt Pocock 实战教程：用一个技能拯救被AI写烂的代码库 —— improve-codebase-architecture【中英字幕】"
source: "https://www.bilibili.com/video/BV1zzgW6FE9m/?share_source=copy_web&vd_source=b235e9c478ba07e2678b1ac01bb439c6"
platform: "bilibili"
video_id: "BV1zzgW6FE9m"
uploader: "ChHsich"
duration_seconds: 1404
tags: ["开发", "Claude Code", "CLI", "命令行", "实战教程", "agent", "Agent", "skills", "Skills", "AI编程"]
rid: "bb9af336-964d-4c72-bb5b-1f8d6d94bea6"
permalink: "/r/bb9af336-964d-4c72-bb5b-1f8d6d94bea6"
webClipUrl: "https://l4p-web-clips.pages.dev/r/bb9af336-964d-4c72-bb5b-1f8d6d94bea6"
---

# 总结稿

暂无总结。

# 辅助理解

# Data

## 原始转写稿

[00:00] 你可能看了 thousands of LinkedIn CEO posts
[00:02] 說 Code is cheap
[00:04] and they can move faster than ever before
[00:07] but what's happening is that AI
[00:09] has simply accelerated software entropy
[00:11] in other words, code bases are falling apart
[00:14] faster than they ever have before
[00:16] because every time that you make a change
[00:17] that doesn't take into account the entire code base
[00:20] you are likely to introduce little things
[00:22] weird things that make the code base harder to change
[00:25] and over time that just snowballs and snowballs
[00:27] until you end up with a huge ball of mud
[00:30] sloppy sloppy mud
[00:31] that is incredibly hard to reverse
[00:34] if you don't know how to do it
[00:35] I've made a video about this before
[00:37] introducing folks to the idea of deep modules
[00:40] and that video focuses more on prevention
[00:42] how you can prevent your setup from getting to that point
[00:45] let's now focus on the cure
[00:47] how you can take a code base
[00:49] that feels like it's beyond repair and rescue it
[00:51] and you can do that with some good old
[00:53] software fundamentals
[00:54] as well as myimprove code base architecture skill
[00:57] we're going to be walking through what this skill does
[01:00] revisiting some of the terms we looked at
[01:01] in the other video
[01:02] and then we're going to take that
[01:03] and apply it to a real code base
[01:05] and this, by the way, is part of my
[01:07] github skills repo
[01:08] which is currently sitting at 41.5k stars
[01:11] bonkers
[01:11] now one of the things that I added to this
[01:13] improve code base architecture skill recently
[01:15] was a glossary of terminology
[01:18] having a shared vocabulary with the AI
[01:19] is super important
[01:21] because it means that you can talk
[01:22] using the same language
[01:24] you can understand what each other's language is
[01:27] and you can be a lot more precise with
[01:29] what you're asking for
[01:30] this terminology here is super
[01:32] duper useful
[01:33] and I'm going to spend a portion of this video
[01:35] going through what each of these terms actually mean
[01:37] honestly just understanding this stuff at a deep level
[01:39] will make you a better software developer
[01:42] so let's get started by talking about modules
[01:44] a module is a unit of something in your application
[01:48] it could be a bunch of react components
[01:50] that all fit together to form a page
[01:52] it could be a bunch of functions inside your application
[01:54] that are entirely responsible forauthentication
[01:57] or it could simply be the logger that you've chosen
[01:59] like alogging to the console
[02:01] logging to a file
[02:01] orlogging to a third party service
[02:03] in a good code base these modules talk to each other
[02:05] and they talk to each other via their interfaces
[02:08] an interface is everything a caller must know
[02:10] to use the module correctly
[02:12] for instance if it's an authentication module
[02:13] then it might have a sign in method
[02:16] it might have a sign out method
[02:17] and these methods are the interface to that module
[02:20] the methods are not the only thing that's important
[02:22] the interface also includes
[02:23] can a nebulous information about how to call the module
[02:27] so perhaps it's documentation too
[02:28] the implementation is then what's inside the module
[02:31] what it actually does when you call sign in or sign out
[02:34] and so this is the core primitive that we're talking about
[02:36] the modules that have interfaces and implementations
[02:39] scattered throughout your application
[02:40] these modules can either be deep modules
[02:43] or they can be shallow modules
[02:45] a deep module hides lots of implementation
[02:48] behind a relatively simple interface
[02:50] a shallow module has a complex interface
[02:53] and kind of not much implementation
[02:55] actually behind it
[02:56] these ideas are from
[02:57] John Austerhout's book
[02:58] a philosophy of software design
[02:59] which I recommend you pick up a copy of
[03:01] deep modules are considered better than shallow modules
[03:03] because it hides more information
[03:05] away from the caller
[03:06] in other words the person who's calling this
[03:08] or the function that's calling this
[03:09] only needs to know about this tiny little interface
[03:11] and they'll get access to all of this implementation
[03:14] lovely
[03:14] and so that's what we describe as depth
[03:16] the amount of behavior a caller can exercise
[03:18] per unit of interface that they have to learn
[03:21] really good open source libraries
[03:22] liketanstackquery
[03:23] or something
[03:24] have really good deep modules
[03:26] in other words they're hiding
[03:27] a lot of complexity behind a super simple interface
[03:30] these modules then interact with each other
[03:32] and they have dependencies on each other
[03:34] for instance this module might interact
[03:36] with this module here
[03:38] which then interacts with this module up here
[03:40] and this module up here
[03:41] and they have these dependency graphs between them
[03:43] these gaps between these modules
[03:45] are called the seams
[03:46] it's the location at which the modules interface
[03:49] lives inside the application
[03:51] these seamsare usually where you're going to do
[03:53] your unit testing
[03:54] or your integration testing
[03:55] for instance if we wanted to test this module
[03:57] in isolation down here
[03:59] then we would add a mock or something
[04:01] just at this seam
[04:02] so figuring out where your seams are going to live
[04:04] in your application is crucial
[04:06] to getting a good architecture
[04:07] when you find out where a seam is in your application
[04:09] you need some concrete thing
[04:11] a module
[04:12] that satisfies that interface
[04:14] this is what I'm going to call an adapter
[04:16] which I'm taking from hexagonal architecture
[04:18] for instance if you have some kind of application
[04:20] that depends on a clock running
[04:22] then you may want to have a clock
[04:24] a normal clock inside here
[04:25] using the actual living clock
[04:27] and then inside some tests
[04:29] you may want to have an adapter
[04:30] that is a fake clock
[04:31] these both satisfy the interface at that seam
[04:34] and it means that you can use the fake clock
[04:36] in tests
[04:36] so you don't have to literally wait two weeks
[04:39] for your test to finish
[04:40] so that's how seams and adapters play together
[04:43] the benefit of all this is that
[04:44] these deep modules have two main properties
[04:47] or two main benefits that you get from them
[04:49] but the maintainers, the people maintaining this module
[04:51] they get locality
[04:52] changes to that module
[04:54] and bugs and all the fixes to do with them
[04:56] they concentratein one place
[04:58] in that deep module
[04:59] if it's scattered around
[05:00] over multiple different modules
[05:02] then you have low locality
[05:04] you want high locality
[05:05] grouping and co-locating the things
[05:07] that matter and often change together
[05:09] the people using this module
[05:11] will get more leverage
[05:12] the deeper the module is
[05:13] in other words more capability
[05:15] per unit of interface they have to learn
[05:17] and so when we're talking about
[05:18] improving our code bases
[05:20] these are the two attributes
[05:21] that we're aiming at
[05:22] right that's enough knowledge
[05:23] we know the basic terms of engagement
[05:25] now let's go and improve a code base
[05:27] the code base we're going to look at
[05:28] is my course video manager code base
[05:30] which is the repo of software
[05:33] that I'm actually using to record this video
[05:34] this code base has had
[05:36] around 1500 commits here
[05:39] and I wouldn't say it's a ball of mud
[05:40] but I also wouldn't say it's perfect either
[05:42] it's a rooter application
[05:44] it uses effect.ts under the hood
[05:46] let's get into it
[05:47] I'm going to open up a new clored session inside here
[05:49] and I'm going to run
[05:50] my improved code base architecture skill
[05:53] and I'm going to turn off auto mode
[05:54] automode does some funny things
[05:55] with these human and the loop style flows
[05:57] and so I don't want it on here
[05:59] we can see it's going and exploring
[06:01] and looking through the code
[06:02] that's what it's instructed to do first
[06:04] here we go
[06:05] explore architecture
[06:06] for deepening opportunities
[06:07] usually a bad code base
[06:09] is one that has a ton
[06:10] of shallow modules in it
[06:11] or one that has very poor leverage
[06:13] for those modules or poor locality
[06:15] where lots of stuff is spread in lots of different places
[06:18] ok it's come back with some candidates here
[06:20] let's bump up the screen size
[06:21] and hopefully clored code won't just destroy itself
[06:25] ok I guess maybe we're not bumping up the screen size
[06:27] thank you for that clored code
[06:28] we can see it's identified six
[06:30] deepening opportunities here
[06:31] these candidates here are pretty hard to explain
[06:33] because they sort of required
[06:35] demain knowledge about my repo
[06:36] but we can see here that it's saying that
[06:38] there's a concept that doesn't have a single scene
[06:41] in other words there are two implementations
[06:43] of this insertion point
[06:44] and they live in parallel
[06:45] and the scene where they must agree is untested
[06:48] this essentially means that the front end
[06:49] could make some changes
[06:51] but the back end because it has a separate
[06:54] parallel implementation
[06:55] could be out of sync with it
[06:56] so this I think is actually a really good candidate
[06:58] for refactoring into a single module
[07:00] we gain locality
[07:02] and it says that here we would gain locality
[07:03] interleave clip clip section ordering rule
[07:05] lives in one place
[07:07] so let's go and take a look at that
[07:09] let's actually say
[07:10] yeah I'd like to pick one here
[07:12] that seems like a good candidate
[07:13] so let's fire that off
[07:14] and see what it says
[07:15] ok Claude is trolling me here
[07:17] it says I'd like to pick one
[07:18] I meant
[07:19] I meant one
[07:21] great
[07:21] ok so it now has come back with
[07:23] it's got concrete code on both sides
[07:25] to ground this
[07:26] and it enters a grilling session
[07:28] and in this grilling session
[07:29] we can take the ideas inside here
[07:32] and we can start kind of talking about
[07:33] what a better solution would be
[07:35] this is a nice instance here
[07:36] the back end has no end
[07:38] let's not think about that too literally
[07:40] what you end up doing with this skill
[07:41] is you end up talking about
[07:43] the potential proposed solution
[07:45] and it will then propose a shape
[07:47] and once that's all done
[07:48] you can take that
[07:49] and you can put that in
[07:50] as a github issue
[07:51] into your issue tracker
[07:52] which can then be picked up by an afk agent
[07:54] you should check out my video on
[07:55] sangcastle
[07:56] if you're interested in that
[07:57] now in the course of normal development
[07:58] what I would do is go through
[07:59] and thoughtfully answer
[08:01] each of these questions in turn
[08:03] but since I'm doing a video
[08:04] and this is slightly artificial
[08:05] I'm going to say
[08:06] could you just choose your recommended answers
[08:09] for each of these questions
[08:10] and that should speed us through
[08:11] actually making the change
[08:13] or potentially creating an issue out of this
[08:15] so it's now coming back
[08:15] with a proposed module shape
[08:17] and it's also asking to verify
[08:19] a particular part of the implementation
[08:21] where end is collapsed
[08:23] and to sketch the actual
[08:24] type script interface
[08:25] yeah go ahead and do both
[08:26] that sounds great
[08:26] let's ping that off
[08:28] and see what it says
[08:29] ok it has figured out
[08:30] the implementation detail it needed
[08:32] and it's come back
[08:33] and proposed a design here
[08:34] so which of these functions
[08:36] are going to be essentially
[08:37] the interface for this module
[08:39] and so we can talk about this
[08:41] with the AI and figure it out
[08:42] it's again come back
[08:43] with two design decisions
[08:45] that it wants my feedback on
[08:46] and here I think
[08:47] you've got the flavour
[08:48] of how this skill works
[08:50] and the kind of conversations
[08:51] that you end up having
[08:52] with the AI based on this
[08:53] if I want to turn this into an issue
[08:54] that my afk agent picks up
[08:56] I can use two prd
[08:58] or two issues here
[09:00] and by the way
[09:00] if you're interested
[09:01] in these skills
[09:02] that I'm talking about
[09:02] then you should check out
[09:03] this site here
[09:05] which is linked below
[09:06] I'm going to be creating
[09:06] a real documentation site
[09:08] for these skills
[09:09] and for now I have a newsletter
[09:10] that you can sign up to
[09:11] for the latest updates
[09:12] as well as tips
[09:13] and tricksand resources
[09:14] for getting the most
[09:15] out of agents
[09:16] the thing that's important
[09:17] to notice here
[09:18] is just how much
[09:19] this skill demands
[09:20] of you,the user
[09:21] this is not an afk skill
[09:22] that you can just sort of run
[09:24] and kind of like
[09:25] just rely on
[09:26] to continually
[09:27] improve your code base
[09:28] this requires a judgement call
[09:29] from you,the programmer
[09:31] sitting above the LLM
[09:32] I think of agents
[09:33] as really really good
[09:35] tactical programmers
[09:37] they're able to get on the ground
[09:38] and make changes quickly
[09:40] but they need someone
[09:41] on the level above them
[09:42] who is the strategic programmer
[09:44] and that's what this skill does
[09:45] it allows the sergeant
[09:47] to go and run around
[09:47] the code base
[09:48] and look for potential
[09:49] improvement opportunities
[09:52] but then you,the general
[09:53] have to go and actually
[09:54] make the change
[09:55] and decide what's good
[09:56] for the long-term
[09:56] health of the code base
[09:57] I recommend that you run
[09:58] this skill
[09:59] you know,every couple
[10:00] of days really
[10:01] especially in a code base
[10:02] that's fast-moving
[10:03] you're going to come up
[10:04] with tons of opportunities
[10:05] for deepening the code base
[10:06] and the deeper you get
[10:07] those modules
[10:08] the higher leverage
[10:09] you're going to get out of them
[10:11] and leverage as well
[10:12] means testing
[10:13] if you have a set
[10:13] of really nice
[10:14] clear seams in your code base
[10:16] then you're going to be able
[10:17] to write really nice tests
[10:19] around those nice deep modules
[10:21] and the better your tests are
[10:22] the better the output
[10:23] from the agent is going to be
[10:24] one final thought here
[10:25] is that lots of folks
[10:26] asked me how
[10:27] you would get started
[10:28] by using AI
[10:30] in a legacy code base
[10:31] and a legacy code base
[10:31] is probably going to have
[10:32] a lot of shallow modules
[10:34] I mean,we talk about
[10:35] legacy code bases
[10:36] what we really mean
[10:37] are bad code bases
[10:38] code bases that are
[10:39] hard to make changes in
[10:41] and what you really need
[10:42] before you start
[10:43] making changes
[10:44] in a legacy code base
[10:45] is a harness
[10:46] around the code base
[10:47] to make sure
[10:48] that your changes
[10:48] don't mess anything up
[10:49] so for that
[10:50] you need tests
[10:51] test testing
[10:52] really nice
[10:53] deep modules
[10:54] that have a lot
[10:54] of leverage
[10:55] and locality
[10:56] so running improved
[10:57] code base architecture
[10:57] is a great place
[10:59] to start
[10:59] thanks for watching folks
[11:00] and I hope that answers
[11:01] some of your questions
[11:02] about how to solve
[11:03] this never-ending problem
[11:05] of AI just running away
[11:07] and creating
[11:07] terrible code bases
[11:08] I hope you enjoy the skills
[11:09] do follow the link below
[11:10] if you want to
[11:11] find more of them
[11:12] so thanks for watching
[11:12] and I'll see you
[11:13] in the next one
[11:14] and what you really need
[11:15] before you start
[11:16] making changes
[11:17] in a legacy code base

## 原始关键帧

### 关键帧 1

![关键帧 1](assets/bilibili-BV1zzgW6FE9m-frame-0001.webp)

### 关键帧 2

![关键帧 2](assets/bilibili-BV1zzgW6FE9m-frame-0002.webp)

### 关键帧 3

![关键帧 3](assets/bilibili-BV1zzgW6FE9m-frame-0003.webp)

### 关键帧 4

![关键帧 4](assets/bilibili-BV1zzgW6FE9m-frame-0004.webp)

### 关键帧 5

![关键帧 5](assets/bilibili-BV1zzgW6FE9m-frame-0005.webp)

### 关键帧 6

![关键帧 6](assets/bilibili-BV1zzgW6FE9m-frame-0006.webp)

### 关键帧 7

![关键帧 7](assets/bilibili-BV1zzgW6FE9m-frame-0007.webp)

### 关键帧 8

![关键帧 8](assets/bilibili-BV1zzgW6FE9m-frame-0008.webp)

### 关键帧 9

![关键帧 9](assets/bilibili-BV1zzgW6FE9m-frame-0009.webp)

### 关键帧 10

![关键帧 10](assets/bilibili-BV1zzgW6FE9m-frame-0010.webp)
