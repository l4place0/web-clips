---
title: "Matt Skills | 你的代码库还没准备好迎接AI？这样改才能让AI真正高效工作"
source: "https://www.bilibili.com/video/BV1HnM269EV7/?share_source=copy_web&vd_source=b235e9c478ba07e2678b1ac01bb439c6"
platform: "bilibili"
video_id: "BV1HnM269EV7"
uploader: "知识搬运工-Coding"
duration_seconds: 530
tags: ["编程", "AI Agent", "Vibe Coding", "大模型"]
rid: "6bb9a372-9a0f-4c34-b325-66ef747cce29"
permalink: "/r/6bb9a372-9a0f-4c34-b325-66ef747cce29"
webClipUrl: "https://l4p-web-clips.pages.dev/r/6bb9a372-9a0f-4c34-b325-66ef747cce29"
---

# 总结稿

暂无总结。

# 辅助理解

# Data

## 原始转写稿

[00:00] A.I. imposes super weird constraints on your codebase
[00:04] and most codebases out there in the world
[00:06] probably including yours are not ready
[00:09] your codebase way more than the prompts that you used
[00:12] way more than your agents.md file
[00:14] is the biggest influence on A.I.'s output
[00:16] and if it's designed wrong
[00:18] it can cost you in a bunch of different ways
[00:20] it can mean that the A.I. doesn't receive feedback fast enough
[00:23] so it doesn't know if what it changed
[00:24] actually did what it intended
[00:26] it can find it super hard to make sense of things
[00:28] and find files and work out even how to test things
[00:31] and finally it can lead you into cognitive burnout
[00:33] as you try to hold together A.I. in your codebase
[00:36] and patch it all up and keep everything in your mind
[00:39] and my thesis here is that software quality matters
[00:41] more than ever
[00:43] in other words how easy your codebase is to change
[00:45] makes a huge impact on how A.I. then goes and changes it
[00:50] and the stuff that we've known about software best practices
[00:52] for 20 years still holds more true than ever
[00:55] and if you're interested in getting better at this stuff
[00:56] then check out my newsletter A.I. Hero
[00:59] I teach you all about A.I. Coding
[01:00] but this is not for vibe coders
[01:02] this is for real engineers solving real problems
[01:05] and if that's you and you're not sure
[01:06] how to handle these new tools
[01:08] then you are gonna love it
[01:09] now let's imagine that this here is our codebase
[01:12] each one of these little squares represents a module
[01:14] and this module might export some functionality
[01:16] it might export a function
[01:18] it might export some variables
[01:19] might export a component
[01:20] if it's like a you know a react or a front-end thing
[01:23] I want you to imagine that this is the image of your codebase
[01:26] that you hold in your head
[01:27] now you might inside here have some vague groupings
[01:30] of different functionality
[01:31] for instance here you might have
[01:32] let's say a thumbnail editor feature
[01:34] and all of these different modules contribute to that
[01:36] over here you might have
[01:37] a little video editor feature or something
[01:39] down here is all the code related to authentication
[01:42] up here is a bunch of
[01:43] crud forms for updating stuff maybe in a CMS
[01:45] and over here are a couple of example features
[01:47] that I can't be bothered to think of examples for
[01:49] now this map that I've created here
[01:51] of all of the located modules
[01:52] in this particular codebase
[01:54] they're not actually reflected
[01:56] that much in the file system
[01:57] they're all really jumbled up together
[01:58] if I want to just grab
[02:00] let's say an export from this module
[02:02] and import it down into this module
[02:03] I can, there's nothing stopping me
[02:05] and so what you might end up with
[02:06] is a bunch of kind of disparate relationships
[02:08] between stuff that doesn't actually relate to each other
[02:11] now you as the developer
[02:12] understand the mental map
[02:13] between all of these modules
[02:14] but what the AI sees
[02:15] when it first goes into your codebase
[02:17] is this
[02:18] it doesn't see all of the natural groupings
[02:21] and all the natural relationships
[02:22] what it seesis a bunch of disparate modules
[02:24] that can all import from eachother
[02:26] that's because AI
[02:27] when it jumps into your codebase
[02:28] it has no memory
[02:29] it has not experienced your codebase before
[02:31] it's like the guy from Memento
[02:33] who just steps in and goes
[02:34] okay, I'm here
[02:35] oh, what am I doing
[02:36] so my first assertion here
[02:37] is that you need to make sure
[02:39] that the file system
[02:41] and the design of your codebase
[02:43] matches this internal map
[02:45] that you have of it
[02:46] this is because
[02:47] if you describe something
[02:48] over in the video editor section
[02:50] and you use it via a prompt
[02:51] then you want the AI
[02:53] to be able to find it easily
[02:54] the AI won't go in
[02:56] knowing every single function
[02:57] every single module
[02:58] and what they're supposed to do
[02:59] and how they link to eachother
[03:01] and the best way I have found to do that
[03:02] is with deep modules
[03:04] now deep modules comes from
[03:06] this book here
[03:06] which is a philosophy of software design
[03:08] and the idea is that
[03:09] in order to make your system
[03:11] easily navigable
[03:12] and easy to change
[03:13] and also easy to test
[03:14] is that you have a deep module
[03:16] so lots of implementation
[03:18] control by a simple interface
[03:19] what that looks like in terms of our graph
[03:21] is instead of many many
[03:23] small modules
[03:24] you end up with these
[03:25] big chunks of modules
[03:27] with simple controllable interfaces
[03:29] and this means that any exports
[03:31] from these modules
[03:32] have to come from that interface
[03:34] now when I read that about deep modules
[03:35] I immediately thought
[03:37] about putting AI
[03:38] in control of these modules
[03:40] because this is an opportunity
[03:41] to introduce a kind of seam
[03:43] into the codebase
[03:44] I don't really care about
[03:45] what's happening inside here
[03:47] which is the implementation
[03:48] I just care about
[03:49] what's happening in the interface
[03:51] because the interface
[03:52] which is the publicly accessible
[03:54] API of this module
[03:56] I can carefully control
[03:57] and I can apply my taste to and design
[04:00] and then the stuff inside here
[04:02] I can just delegate
[04:03] to an AI to control
[04:04] and I can write tests
[04:06] that completely lock down
[04:08] the module in terms of its behavior
[04:09] so these are not just deep modules
[04:11] with simple interfaces
[04:12] they're also gray box modules
[04:14] in other words
[04:15] I don't actually need
[04:16] to look inside these modules
[04:18] I can if I want to
[04:19] if I want to influence
[04:20] their outcome
[04:21] or if I need to apply
[04:22] some taste to the implementation
[04:24] or I need to improve
[04:24] their performance or something
[04:26] but as long as the tests
[04:27] are good
[04:27] then I don't really need to care
[04:29] about what happens inside
[04:30] now this has three
[04:31] massive benefits
[04:32] the first one is that
[04:33] I can make my codebase
[04:35] way more navigable
[04:36] let's for the sake of argument
[04:37] just call each of these services
[04:39] right
[04:39] the video editor service
[04:40] the thumbnail service
[04:41] whatever
[04:41] if I document these
[04:42] each inside their own folder
[04:44] and I have the publicly accessible
[04:46] interface
[04:46] kind of like really obvious
[04:48] in a type section
[04:49] then the AI
[04:50] when it's exploring
[04:51] my codebase
[04:52] it can see
[04:53] all of these different
[04:53] services
[04:54] on the file system
[04:55] it can read
[04:56] and understand
[04:56] the types
[04:57] that they export
[04:58] before it actually
[04:59] looks at the implementation
[05:00] and then it can say
[05:01] ok
[05:01] I've seen the interface
[05:02] I understand
[05:02] what this does
[05:03] I don't need
[05:04] to look inside
[05:04] because I can just
[05:05] trust what it's returning
[05:06] in other words
[05:06] we've designed
[05:07] our codebase
[05:07] for progressive
[05:08] disclosure
[05:09] of complexity
[05:10] the interface
[05:10] sits at the top
[05:11] and it just explains
[05:12] what the module does
[05:13] and then
[05:14] when we need to
[05:15] we can look inside
[05:16] the module
[05:16] and make changes to it
[05:17] or look at it
[05:18] to understand
[05:19] it's behavior
[05:19] more deeply
[05:20] the second one
[05:20] is that
[05:20] we reduce
[05:21] the cognitive
[05:22] burnout
[05:23] of managing
[05:23] this codebase
[05:24] now
[05:24] as a user
[05:25] I can just go
[05:26] right
[05:26] I need something
[05:27] from
[05:28] I don't know
[05:29] this made up feature
[05:29] or let's say
[05:30] the authentication
[05:31] bit over here
[05:32] let's say
[05:33] let's see
[05:33] what the public
[05:34] interface is
[05:35] let's just
[05:35] grab that
[05:36] and use it
[05:36] and instead
[05:37] of needing
[05:37] to think about
[05:38] the interrelationships
[05:39] between
[05:39] all of these modules
[05:40] I can just
[05:40] keep
[05:41] kind of like
[05:41] seven or eight
[05:42] lumps of stuff
[05:43] in my head
[05:44] and gook
[05:44] the AI
[05:45] manages
[05:45] the stuff
[05:46] inside that
[05:47] I only need
[05:48] to worry about
[05:48] designing
[05:49] the interfaces
[05:49] and how
[05:49] they fit together
[05:50] now this
[05:50] of course
[05:51] is still
[05:51] a million
[05:51] miles away
[05:52] from
[05:52] vibe coding
[05:53] because
[05:53] you need
[05:53] to apply
[05:54] taste
[05:55] at the boundaries
[05:55] of these modules
[05:56] you need
[05:57] to be
[05:57] really good
[05:57] at deciding
[05:58] okay
[05:58] what goes
[05:59] into
[05:59] that
[05:59] module
[06:00] what goes
[06:00] into
[06:00] that
[06:00] module
[06:01] and what
[06:01] you really
[06:01] want to
[06:02] avoid
[06:02] are
[06:02] lots
[06:03] of little
[06:03] shallow
[06:04] modules
[06:04] which
[06:04] is kind
[06:05] of what
[06:05] we had
[06:05] up here
[06:06] right
[06:06] each
[06:06] of these
[06:06] modules
[06:07] is just
[06:07] like
[06:07] sure
[06:08] it's
[06:08] kind of
[06:08] interrelated
[06:09] and group
[06:10] together
[06:10] But really there are lots of tiny shallow modules which are testable in these tiny units which are really hard to keep all in your head and so by simplifying the mental map of the codebase we reduce cognitive burnout that comes from managing this codebase and again this is nothing new this is a 20 year old software practice and the third one here I mean I'm really just repeating myself but this is what we've been doing all along this is how good code bases have supposed to have been designed so what works here for humans is also great for AI
[06:39] we need to stop thinking about AI as like this superpowered developer as like you know it's gonna reach AGI and understand that it's got some weird limitations and the limitations that it has are that it's a new starter in your codebase so you need to make your codebase friendly and ready for new starters because you're going to be spawning like 20 new starters every day here
[06:59] probably more just to look at your codebase and make changes
[07:02] so that means the map of your codebase needs to be easily navigable and it needs to be enforced by using these modules
[07:08] now some languages make this easier than others
[07:11] for instance in typescript and javascript it's actually not that easy to make these services make these modules sort of boundaryed in this way
[07:19] I want to give a quick shout out to effect because I posted a video on effect a few months ago
[07:24] I'm actually using effect way more than I did back then
[07:27] and it makes this kind of sort of seeming modularizing of your codebase really simple
[07:33] the final thing I want to say here is that you need to be thinking about these modules and how you're effecting them and how you're designing the interfaces in every coding session that you do
[07:42] that means right from the early planning stage when you're writing your PRDs or when you're turning your PRDs into implementation issues
[07:48] you need to be thinking about the modules that you're effecting and the interfaces and how you're going to test them
[07:53] because tests and feedback loops are essential for an AI because of course they're essential for a new starter joining the codebase
[08:00] if you want a new starter to contribute effectively you need a well tested codebase so they can see what their changes do as they ripple out
[08:07] so that's my rant for today your codebase is probably not ready for AI because you're not using enough deep modules
[08:13] and instead you've got a web of interconnected kind of shallow modules like this which are really hard to navigate
[08:19] and really hard to test and really hard to keep in your head
[08:23] now if you dig this then of course you will dig my newsletter where we go more deeply into topics like this
[08:27] thanks for watching folks what else do you think goes into making a great codebase for AI
[08:31] I really love this metaphor for deep modules but I know it's not the only one going there are plenty out there
[08:36] thanks for watching and I will see you very soon
[08:38] so when you're thinking about your codebase with AI what are you thinking about
[08:41] what kind of 20 year old books do you want to recommend
[08:44] leave it in the comments
[08:45] it's the easiest way to keep up with all my stuff and the link is below

## 原始关键帧

### 关键帧 1

![关键帧 1](assets/bilibili-BV1HnM269EV7-frame-0001.webp)

### 关键帧 2

![关键帧 2](assets/bilibili-BV1HnM269EV7-frame-0002.webp)

### 关键帧 3

![关键帧 3](assets/bilibili-BV1HnM269EV7-frame-0003.webp)

### 关键帧 4

![关键帧 4](assets/bilibili-BV1HnM269EV7-frame-0004.webp)

### 关键帧 5

![关键帧 5](assets/bilibili-BV1HnM269EV7-frame-0005.webp)

### 关键帧 6

![关键帧 6](assets/bilibili-BV1HnM269EV7-frame-0006.webp)

### 关键帧 7

![关键帧 7](assets/bilibili-BV1HnM269EV7-frame-0007.webp)

### 关键帧 8

![关键帧 8](assets/bilibili-BV1HnM269EV7-frame-0008.webp)

### 关键帧 9

![关键帧 9](assets/bilibili-BV1HnM269EV7-frame-0009.webp)

### 关键帧 10

![关键帧 10](assets/bilibili-BV1HnM269EV7-frame-0010.webp)
