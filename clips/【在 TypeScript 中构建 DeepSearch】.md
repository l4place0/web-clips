---
title: "【在 TypeScript 中构建 DeepSearch】"
source: "https://www.bilibili.com/video/BV1Unbz6AEda/?share_source=copy_web&vd_source=b235e9c478ba07e2678b1ac01bb439c6"
platform: "bilibili"
video_id: "BV1Unbz6AEda"
uploader: "计算机编程指导小师傅"
duration_seconds: 16517
tags: ["学习", "教程", "Matt Pocock", "自用"]
---

# 总结稿

暂无总结。

# 辅助理解

# Data

## 原始转写稿

[00:00] Hello folks, and welcome to my course on implementing deep search in TypeScript.
[00:05] We're going to be building an application from the ground up, winding our way through all the nasty little journeys that go into building a complex app.
[00:13] We're going to hit dead ends that don't work, we're going to experiment with things.
[00:17] We're going to end up with something pretty solid, but on the way we're going to learn what works and what doesn't in this space.
[00:22] We're going to be doing it with the Vercel AISDK, with Next.js, with Postgres, with Drizzle.
[00:26] And these tools should be either be very familiar to you already, or will be very familiar to you by the time we finish.
[00:32] But what is it that we're actually building?What are we aiming for?
[00:35] Well, I got inspired to build this course based on this article on Gina.ai.
[00:39] It's a practical guide to implementing deep search/deep research.
[00:43] Deep research implementations are like everywhere right now.
[00:46] Google has deep research,OpenAI has deep research,Claude has research.
[00:50] And the process of deep research is you search a corpus of information like the web, let's say.
[00:55] You take all the information you've gathered, hundreds of sources, and you pull it all together into this huge great big report.
[01:01] And while this is useful, obviously, I didn't think it was that widely applicable to many different projects.
[01:06] Deep search, though, is a much simpler primitive and can actually fit into lots of different systems.
[01:11] You take the user query, you then search the web, read the sources that you gather,
[01:15] and then reason whether you need to continue searching.
[01:18] And then finally, you produce a relatively concise answer to that user query.
[01:21] This acts as a guard against hallucinations.And in pretty much any AI application,
[01:26] you're going to be worried about controlling the AI,forcing it to rely on actual sources of information instead of its training data.
[01:33] So whereas deep research is very specialized to a certain type of UI,
[01:36] the concepts behind deep search can be applied to many different AI applications.
[01:41] We're going to be building a simple version of this first and then adding more complexity as we try to squeeze out more performance from our system.
[01:48] And along the way,we're going to be building a chat-based UI and hooking this up to it.
[01:52] Because,and I keep banging this drum,I really think the differentiator between good and great AI apps
[01:58] is not the AI itself,but the user experience.
[02:01] And so let's try to build a really awesome AI app that has as few hallucinations as possible
[02:07] and the best user experience we can possibly create.

## 原始关键帧

### 关键帧 1

![关键帧 1](assets/bilibili-BV1Unbz6AEda-frame-0001.webp)

### 关键帧 2

![关键帧 2](assets/bilibili-BV1Unbz6AEda-frame-0002.webp)

### 关键帧 3

![关键帧 3](assets/bilibili-BV1Unbz6AEda-frame-0003.webp)

### 关键帧 4

![关键帧 4](assets/bilibili-BV1Unbz6AEda-frame-0004.webp)

### 关键帧 5

![关键帧 5](assets/bilibili-BV1Unbz6AEda-frame-0005.webp)

### 关键帧 6

![关键帧 6](assets/bilibili-BV1Unbz6AEda-frame-0006.webp)

### 关键帧 7

![关键帧 7](assets/bilibili-BV1Unbz6AEda-frame-0007.webp)

### 关键帧 8

![关键帧 8](assets/bilibili-BV1Unbz6AEda-frame-0008.webp)

### 关键帧 9

![关键帧 9](assets/bilibili-BV1Unbz6AEda-frame-0009.webp)

### 关键帧 10

![关键帧 10](assets/bilibili-BV1Unbz6AEda-frame-0010.webp)
