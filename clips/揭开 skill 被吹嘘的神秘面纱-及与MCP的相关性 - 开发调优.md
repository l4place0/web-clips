---
Title: 揭开 skill 被吹嘘的神秘面纱-及与MCP的相关性 - 开发调优
Url: "https://linux.do/t/topic/1471411"
Author: LINUX DO
Origin: LINUX DO
Description: "最近发现skill很火，但是被炒的好像无所不能一样，什么给ai了新能力，是新阶段等等，吹的五花八门的 \n实际上稍微了解一下就会发现，这不就是把一个原来需要你主动发送或者要求ai读取的文档，改成了先发摘要，让ai根据摘要和当前上下文自行决定是…"
Tags:
  - Skill
  - MCP
  - 工作流
  - source/LinuxDo
Created: "2026-04-08 20:51:56"
Cover: "https://cdn.linux.do/user_avatar/linux.do/lianues/96/1038066_2.gif"
publish: true
rid: "9f68012f-7161-4bcb-ac9b-23c8b12bed67"
permalink: "/r/9f68012f-7161-4bcb-ac9b-23c8b12bed67"
webClipUrl: "https://l4place0.github.io/web-clips-publish/r/9f68012f-7161-4bcb-ac9b-23c8b12bed67"
---
[羽织](https://linux.do/u/lianues) [Lianues](https://linux.do/u/lianues)

[1月 17 日](https://linux.do/t/topic/1471411 "发布日期")

最近发现skill很火，但是被炒的好像无所不能一样，什么给ai了新能力，是新阶段等等，吹的五花八门的

实际上稍微了解一下就会发现，这不就是把一个原来需要你主动发送或者要求ai读取的文档，改成了先发摘要，让ai根据摘要和当前上下文自行决定是否读取内容吗？就是喜欢硬造一些所谓的神秘概念

---

## skill原理：

在工具列表里，定义了一个skills工具，你写的任何skill文档里name和描述部分，都会被按一定的格式转成xml格式化后添加到这个工具描述里发给ai  
注意不是添加到系统提示词，是添加到了tools里  
然后ai需要时，会发送一个function call/too use 来调用skills工具来读取某个skill的具体内容  
然后skill具体内容就会作为工具响应添加到上下文里发给ai  
注意，加进去以后是不会被删除的，就算当前任务不需要了也不会被删除。所以其实和使用read工具读取一个文档没有区别

然后如果你的skill文件夹里加了几个脚本，比如aaa.py，然后在skill.md里描述了这个脚本的作用，那么ai就可以通过命令行Bash工具来执行这个脚本，比如 python aaa.py  
（这里注意一点，不是skill提供了脚本执行能力，是skill描述了脚本的作用，ai最后还是要通过一个执行工具来执行脚本的，这个执行工具本身不是skill的东西）

但是你想一下，这和你自己写个文档，让ai阅读后ai自己调用有区别吗？几乎没有。

综上，skill本质上就是读文档，只是一个是先读摘要后读内容，一个是直接发内容或者ai直接读内容

为什么叫skill？因为好炒作吹嘘  
实际上叫文库/图书馆/文档库更合适

---

## 再讲一下所谓的节省上下文

- 这个文档原来是你主动让ai读取→没有节省上下文
- 这个文档原来是让ai自行读取→某种程度上会节约，因为ai可以根据摘要决定他读取哪个文档。而如果没有skill ai只能根据文件名来猜测。减少了ai读取无用文档造成的浪费。但是这种情况一般很少，因为大部分文档是人想让ai读取才会加的，所以几乎全部不属于这点

## 那么skill还有用吗？他的优点是什么？

- 当然有用，毕竟这个文档是跨项目的，通用的，可以复制分享的，可复用的
- 任何人可以分享自己写的skills，其他人可以很方便的使用，不需要自己写文档

## 那和MCP的区别是什么

- 两者是互相独立的，实际上不存在说谁更好的说法
- MCP是把一些外部交互封装为了function calling那样的json接口，方便ai输出function calling来调用
- 而skill是描述外部工具/工作流的提示词
- 所以两者更多的是互补的关系，你可以很方便的把mcp注册的工具融合进skill里，封装为外部的py脚本等，也可以直接注册到当前发给ai的tools列表里使用。而如果没有mcp协议，那么你想要调用外部工具，就需要给每个工具的结构单独处理十分麻烦

---

**本贴不是在否定skill，只是在批判各种营销号能把一个2分钟讲清的东西，讲十几分钟，吹的五花八门，硬造概念**

[12](https://linux.do/u/Lianues "Lianues")

[9](https://linux.do/u/HLiny "HLiny")

[5](https://linux.do/u/atopos31 "atopos31")

[4](https://linux.do/u/Kevin34 "Kevin34")

[4](https://linux.do/u/komorebi "komorebi")

阅读时间 6 分钟