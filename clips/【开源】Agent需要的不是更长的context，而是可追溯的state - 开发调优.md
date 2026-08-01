---
Title: 【开源】Agent需要的不是更长的context，而是可追溯的state - 开发调优
Url: "https://linux.do/t/topic/2245221"
Author: 
Origin: LINUX DO
Description: Info  真诚 、 友善 、 团结 、 专业 ，共建你我引以为荣之社区。 《社区准则》    开发调优      本帖使用社区开源推广，符合推广要求。我申明并遵循社区要求的以下内容：  我的帖子已经打上 开源推广 标签： 是 我的开源项目完整开源，无未开源部分： 是 我的开源项目已链接认可 LINUX DO 社区： 是 我帖子内的项目介绍，AI生成、润色内容部分已截图发出： 是 以上选择我承诺是
Tags: []
Created: "2026-05-28 13:39:00"
Cover: "https://cdn3.ldstatic.com/optimized/4X/0/0/7/007d58d6227128a45224884ed21c942aead7fc18_2_1024x512.png"
publish: true
rid: "50e557f9-9169-4b3f-8729-bf8db0e828d7"
permalink: "/r/50e557f9-9169-4b3f-8729-bf8db0e828d7"
webClipUrl: "https://l4p-web-clips.pages.dev/r/50e557f9-9169-4b3f-8729-bf8db0e828d7"
---
Info

**真诚**、 **友善**、 **团结**、 **专业**，共建你我引以为荣之社区。 [《社区准则》](https://linux.do/guidelines)

[开发调优](https://linux.do/c/develop/4)

#### 本帖使用社区开源推广，符合推广要求。我申明并遵循社区要求的以下内容：

- **我的帖子已经打上 [开源推广](https://linux.do/tag/2234-tag/2234) 标签：** 是
- **我的开源项目完整开源，无未开源部分：** 是
- **我的开源项目已链接认可 LINUX DO 社区：** 是
- **我帖子内的项目介绍，AI生成、润色内容部分已截图发出：** 是
- **以上选择我承诺是永久有效的，接受社区和佬友监督：** 是

*以下为项目介绍正文内容，AI生成、润色内容已使用截图方式发出*

---

Hi各位佬友，我是Jia，一名有9年AI经验的00后，同时也是 Spice 的创始人，前面两条关于 Spice 的 post 分别讲了 Spice 的起源，架构及和普通 Agent 在方法论上的区别，很多佬友给我点了 star 和 fork，不同的朋友用在了 research，产品经理 agent，做量化等等，感谢大家给我们的反馈，今天想从另一个角度聊聊 Spice 特别的地方。

## 1\. 从 Prompt 到 Context，再到 State

从24年开始火的 prompt engineering，到25年的 context engineering，Agent 的工程重心一直在往前移，最早关心的是“如何让模型按预期回答”于是有了 prompt engineering，后来想解决“怎么把正确的信息放入上下文”有了 context engineering，再往后我认为会变成“如果长期有效地维护用户的状态”，让 Agent 长期且深入的进入用户的生活，在Spice里我叫做 **State Engineering**

简单概括：

- Prompt Engineering 解决的是：模型这次该怎么说
- Context Engineering 解决的是：模型这次能看到什么
- State Engineering 解决的是：系统现在相信什么，模型基于什么来做下一次决策

这也是我现在理解 Spice 的核心之一：不是让 context 更长，而是让 state 更可靠

## 2\. Prompt Engineering：控制模型如何回答

早期大家做 LLM 应用的时候，模型会跑题，格式不稳定，不按要求输出，这个问题很简单：“模型太自由了”，同一个问题，不同的 prompt 会得到完全不同的回答，所以早期的 Prompt Engineering 本质是在一次模型调用里，通过 system prompt、role prompt、step-by-step、output schema 等方式约束 LLM “这次该怎么回答”。

Prompt Engineering 让 LLM 从一个 chatbot 变成了可以被产品调用的能力。只要prompt 足够清晰，模型就能在一个稳定的边界内完成任务，现在很火的 skills，本质上也继承了 prompt engineering 的思路。以及那时候很多垂直领域做的套壳 Agent，所以 prompt engineering 解决的是 instruction 的问题。

但 prompt engineering 的边界也很明显，他的主要作用是在单次调用里，他能约束模型“这次该怎么回答”，但当一个 Agent 需要长期运行，问题就不只是 prompt 写得好不好了，而是模型每次回答时，到底能不能看到正确、相关、及时的信息。于是问题自然转向了 context

## 3\. Context Engineering：让模型看到正确的信息

当 prompt engineering 把LLM的回答变得相对可控以后，大家很快发现另一个问题：模型会回答问题了，但是时常因为上下文缺失，看不到“正确信息”而导致回答失真。

比如它不知道当前项目的代码结构，不知道用户之前说过什么，不知道外部工具刚刚返回了什么。这时，只靠把 prompt 写得更好是不够的，因为问题不在 instruction，而在 context

于是围绕着 Context 问题有了很多工程方法： RAG， memory，session history，context packing等等。他们都在解决如何把这次任务有用的信息，尽可能准确的放到 LLM 的上下文里。

模型不再只是依赖参数里的“知识”，而是可以结合用户历史、文档、代码、工具结果和外部环境来完成任务。很多 Agent 能不能工作，关键不在模型本身，而在 context 是否组织得足够好。（Manus是那时候 context engineering 做得好的代表）

但 context engineering 也有他的边界， **他本质上还是在给 LLM 组装一次推理时的 working set**。 他像是一个“临时缓存视图”，当模型遇到相关 Task 时，系统从 memory、工具结果、历史记录里找出一批可能相关的内容，然后放进 context，让 LLM 在这次调用里参考这些材料。25年一整年所有 LLM 都在疯狂的拉大自己的 context window，以及后续 Agent 关于处理 long context 的 compaction 等解决方案。  
所以 context 可以告诉模型“你这次可以参考什么”，但当我们使用 Agent 的程度越来越深，数量越来越多，你是不是也烦恼不同 Agent 之间的 context 不互通（当然现在有很多A2A）， context 散落在不同的角落，这时系统需要维护的不只是每个 Agent 里更大的 Context。

我们把下一层称为 **State Engineering**

## 4\. State Engineering：从上下文转变为状态建模

如果说 context engineering 解决的是“模型这次能看到什么”，那 state engineering 想解决的是：“系统现在到底相信什么” 及系统在当前的状态。这里的 state 不是再是简单的 context 问答， 也不是把所有历史记录都塞入 memory， **他是系统对用户所处“世界”的建模，对当前用户、环境、任务和约束的一份可更新投影**，一个新信息进来以后，系统需要判断它是否真的改变了当前状态，而不是简单地把它存下来，等下次再召回。

比如某个 Agent 今天执行一个任务失败了。context 里可以记录这次失败，但系统不能立刻得出“这个 Agent 不适合做这类任务”。它需要看失败原因是工具权限、信息缺失、执行错误，还是任务本身不可行。不同归因会导致完全不同的下一次决策。

所以 State Engineering 关心的是一个更完整的链路：

```
signal -> observation -> evidence -> reducer -> state -> decision -> outcome feedback
```
- signal 是外部发生的原始输入无论物理世界还是数字世界，比如用户一句话、一次工具调用结果、一个传感器事件、一次任务失败。
- observation 是系统从 signal 中识别出来的结构化变化。
- evidence 是支撑这个 observation 的来源和证据。
- reducer 决定这个 observation 是否应该更新 state。
- state 再影响下一次 decision。
- decision 的结果和用户反馈，又会反过来更新 state。

这听起来很像一个结构化的 memory， 但其实 memory 和 state 不同，memory 更像是为了召回和压缩服务的缓存，它可以帮助系统在需要时找到过去的信息。但 memory 里的东西可能过期、冲突、错误，也可能只是历史记录。State 则应该是经过验证、归因和更新后的当前投影。

所以 state engineering 不是单纯地做更大的 memory，也不是把 context window 拉得更长，而是让系统知道：当前的完整状态是什么样，哪些信息被接受为当前状态的一部分，哪些信息只是历史材料，哪些信息应该失效，哪些信息会影响下一步决策。

## 5\. Spice - Decision Layer

放在这个演进里看，Spice 不是想替代 prompt engineering 或者 context engineering，Spice 关心的是如何把这些进入系统的 signal 转化成用户的长期 state， LLM 每次基于当前 state 进行辅助决策及推演，记录决策与执行结果然后不断的更新 state，所以我更愿意把 Spice 称为一个 decision layer。

有些佬友和朋友问我，Spice 和 Harness想解决的事情是不是差不多，Harness 更关注的是“怎么执行”：比如如何隔离运行环境，如何调用工具，如何管理流程，如何记录日志，如何保证执行安全。它包在 agent 或 executor 外面，让执行过程更可控。对于 Spice 来说，更关注的是“为什么执行”：在真正调用 executor 之前，系统当前处在什么状态？有哪些可选 decision？每个 decision 的依据是什么？选择某个candidate会发生什么？ 是否符合用户偏好和约束？执行后的结果又如何改变下一次 decision？也就是说，harness 管的是 execution control，Spice 想管的是 decision control。我们的目的都是让 Agent 可以更好的完成任务，能长期的存在于我们的生活中，只是关注的是不同的 layer。

用一个简单的链路表示：

```
context / signal
  -> observation
  -> state
  -> candidate decisions
  -> compare / approve
  -> execution handoff
  -> outcome feedback
```

这里 executor 可以是一个 coding agent、一个 research agent、一个 browser automation、具身机器人等。Spice 不一定要替代它们，而是希望在它们之前，提供一个更清楚的 decision interface 以及维护一个完整的 state，充当这些 Agent 的大脑。

## 6\. 总结

Agent 系统真正难的不是再加一个 skill，也不是再包一层 executor，而是如何维护一个可追溯、可更新、可被验证的 state，并让它稳定地影响下一次 decision。让每次结果能更好的归因，能清晰的了解这个 “黑盒” 里是如何决策的，让 Agent 真正具备长期存在和持续进化的能力。

这些问题如果不解决，Agent 就很难真正长期运行。它可能短期看起来很智能，但跑久以后 state 会漂移，memory 会堆积，错误归因会累积，最后系统越来越难解释，也越来越难修正。

这也是我想做 Spice 的重要原因之一，它不是为了让 Agent 显得更“聪明”， **而是为了让 Agent 的长期决策过程更可追溯、更可修正、更可进化。**

更多有关 Spice 的内容各位佬友可以去我之前的帖子，也可以上我的 Github 研究一下，非常希望大家 star 以及 fork 下来试用一下，多多给我们反馈也欢迎一起共创，大家有任何问题可以评论区找我啊！