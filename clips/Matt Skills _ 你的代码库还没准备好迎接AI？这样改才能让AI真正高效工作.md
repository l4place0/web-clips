---
title: "Matt Skills | 你的代码库还没准备好迎接AI？这样改才能让AI真正高效工作"
source: "https://www.bilibili.com/video/BV1HnM269EV7/?share_source=copy_web&vd_source=b235e9c478ba07e2678b1ac01bb439c6"
platform: "bilibili"
video_id: "BV1HnM269EV7"
uploader: "知识搬运工-Coding"
duration_seconds: 530
tags: ["编程", "AI Agent", "Vibe Coding", "大模型"]
rid: "88cddc7c-bac1-450a-907b-1248f664e180"
permalink: "/r/88cddc7c-bac1-450a-907b-1248f664e180"
webClipUrl: "https://l4place0.github.io/web-clips-publish/r/88cddc7c-bac1-450a-907b-1248f664e180"
---

# 总结稿

## 核心观点

视频认为，AI 编程效果受代码库结构的影响，往往不亚于提示词或 `AGENTS.md`。AI 每次进入代码库都像一名缺少历史记忆的新成员：如果文件布局无法反映业务边界、模块可任意交叉引用、测试反馈又慢，它就难以定位修改范围、理解影响并验证结果。

## 内容脉络

- **问题画像**：开发者脑中有按功能划分的系统地图，但文件系统里可能只是彼此可随意导入的小模块。人能依赖长期记忆理解关系，AI 首次进入时看到的却是缺乏边界的依赖网。
- **结构建议**：让文件夹与业务概念对齐，并采用“深模块”——用较小、稳定的公开接口封装较多实现细节，所有跨边界访问都通过接口发生。
- **AI 协作方式**：人重点设计模块边界、接口和验收标准；实现细节可以更多交给 AI，但必须通过测试锁定外部行为。必要时人仍可进入模块检查性能或实现取舍，因此视频把它描述成“灰盒”，而非完全不可见的黑盒。
- **三个收益**：代码库更容易导航；复杂度按接口到实现逐层披露；人只需管理少数模块及其组合关系，降低认知负担。
- **贯穿开发流程**：从 PRD、实现任务到编码阶段，都应明确受影响的模块、接口变化与测试方式，为 AI 提供快速、局部、确定的反馈。

## 结论

“让代码库为 AI 做好准备”并不是堆更多提示文档，而是回到良好的软件设计：清晰边界、简单接口、受控依赖和可靠测试。视频强调，这仍要求工程师在边界处作判断，并不等同于无需设计的 vibe coding。

# 辅助理解

## 辅助理解

### 视频内容：AI 看见的是代码结构，而不是人的心智地图

开发者可能知道“认证”“视频编辑”“缩略图”等功能分别由哪些文件构成，但这种隐性分组若没有体现在目录、接口和依赖限制中，AI 只能看到一张任意互联的模块网。Frame 2 直观展示了跨区域箭头造成的边界穿透。

![关键帧 2](https://assets.l4p.site/media/61/61f75bc3d67de2b7026e3a5524ce511aa042147e3ca78ddd6495ef358f786e89.webp)

```mermaid
flowchart LR
    P[需求或任务] --> M[定位业务模块]
    M --> I[阅读公开接口]
    I --> C[修改模块内部实现]
    C --> T[运行局部测试]
    T -->|通过| O[提交可验证结果]
    T -->|失败| C
    I -.禁止任意跨越边界.-> X[其他模块内部]
```

这个流程体现“渐进披露复杂度”：先通过模块名、目录和类型接口判断职责，只有真正需要修改时才进入实现。公开接口既是人类的抽象边界，也是 AI 的导航索引。

### 视频内容：深模块与浅模块

| 结构 | 接口与实现 | 对 AI 的影响 |
|---|---|---|
| 大量浅模块 | 接口较多，封装收益较少，关系分散 | 搜索范围大，需同时理解更多依赖 |
| 少数深模块 | 简单接口封装较多实现 | 可先理解边界，再局部修改与验证 |

Frame 6 展示大量“小而浅”的单元。单个小单元虽然可以测试，但当它们形成密集交叉依赖时，系统级修改仍难导航、难评估影响，也增加人的认知负担。

![关键帧 6](https://assets.l4p.site/media/70/70e25ec0bf5fe93c8c4bad9a16a47938e6ab3cf5ed42d4afc4540381c1a11f09.webp)

### 视频内容：测试是 AI 的反馈通道

清晰模块只解决“在哪里改”，测试与反馈循环才回答“改对了吗”。视频强调在规划阶段就确定受影响模块、接口和测试，使 AI 能够快速观察修改结果，而不是等到大范围集成后才发现偏差。

![关键帧 8](https://assets.l4p.site/media/7e/7e7c325e5eb434957090d73e7a9d4d0547d00811b19346e26937cf6ac7d4c020.webp)

### AI 辅助推断：把代码库当作 Agent 的操作环境

可将 AI-ready codebase 理解为一种环境设计：目录提供地图，接口提供允许的动作，类型与静态检查提供即时约束，测试提供奖励或错误信号。提示词只是在这个环境中下达任务；如果环境没有边界与反馈，再好的提示也难以稳定弥补结构问题。这一表述是对视频论点的系统化推演，不是视频中的原句。

### 外部核验补充

视频在 03:04 将“深模块”追溯到 John Ousterhout 的《A Philosophy of Software Design》。作者的官方书籍页面和 Stanford 课程材料确实把深/浅类、接口与实现、信息隐藏列为核心设计思想，支持这一出处说明：[John Ousterhout：A Philosophy of Software Design](https://web.stanford.edu/~ouster/cgi-bin/aposd.php)、[Stanford CS 190 课程讨论](https://web.stanford.edu/~ouster/cgi-bin/cs190-winter21/lecture.php?topic=bookReview)。

不过，“深模块一定让 AI 更高效”是视频作者基于这些设计原则提出的应用判断，本次核验材料没有直接提供 AI 编程效果的对照实验，因此不应把它表述为已被基准测试普遍证明的结论。

# Data

## 增强转写稿

[00:00] A.I. imposes super weird constraints on your codebase
[00:04] and most codebases out there in the world
[00:06] probably including yours are not ready
[00:09] your codebase way more than the prompts that you used
[00:12] way more than your AGENTS.md file
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
[01:51] of all of the related modules
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
[02:22] what it sees is a bunch of disparate modules
[02:24] that can all import from each other
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
[02:59] and how they link to each other
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
[03:18] controlled by a simple interface
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
[05:19] its behavior
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
[05:44] and go, okay,
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
[07:11] for instance in typescript and javascript it's actually not that easy to make these services make these modules sort of bounded in this way
[07:19] I want to give a quick shout out to effect because I posted a video on effect a few months ago
[07:24] I'm actually using effect way more than I did back then
[07:27] and it makes this kind of sort of seaming and modularizing of your codebase really simple
[07:33] the final thing I want to say here is that you need to be thinking about these modules and how you're affecting them and how you're designing the interfaces in every coding session that you do
[07:42] that means right from the early planning stage when you're writing your PRDs or when you're turning your PRDs into implementation issues
[07:48] you need to be thinking about the modules that you're affecting and the interfaces and how you're going to test them
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

![关键帧 1](https://assets.l4p.site/media/d9/d9adba3a62b3233b0e56611fb17365fe1c51e61a159200cc73f0389ff7b0b9d4.webp)

### 关键帧 2

![关键帧 2](https://assets.l4p.site/media/61/61f75bc3d67de2b7026e3a5524ce511aa042147e3ca78ddd6495ef358f786e89.webp)

### 关键帧 3

![关键帧 3](https://assets.l4p.site/media/88/888f195070c0cb0f0e4a0580d683918d0734fc5e5db277cb2b76def74978ad9e.webp)

### 关键帧 4

![关键帧 4](https://assets.l4p.site/media/f5/f5791f851e0547a63318b20adfe2f9213bc2f1e1f26a209707656b94a06354de.webp)

### 关键帧 5

![关键帧 5](https://assets.l4p.site/media/46/4600951cb3be5e41c39e1260daf09c0c7dc9617407a7d3de282db64308db69ce.webp)

### 关键帧 6

![关键帧 6](https://assets.l4p.site/media/70/70e25ec0bf5fe93c8c4bad9a16a47938e6ab3cf5ed42d4afc4540381c1a11f09.webp)

### 关键帧 7

![关键帧 7](https://assets.l4p.site/media/bf/bfd7b5b04d4f96071b7226f3ffec2e05946914aee81ed3b7305581479c6d3339.webp)

### 关键帧 8

![关键帧 8](https://assets.l4p.site/media/7e/7e7c325e5eb434957090d73e7a9d4d0547d00811b19346e26937cf6ac7d4c020.webp)

### 关键帧 9

![关键帧 9](https://assets.l4p.site/media/ec/ecfa31e0ae7eb74d0d3b017250bdcc7df69d2ad1b8576c40dd58d033ef02b251.webp)

### 关键帧 10

![关键帧 10](https://assets.l4p.site/media/18/18445d7bda898e3d6798d5df4238adbef9aca6b8c5631800b3e91be0368c970b.webp)
