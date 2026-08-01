---
Author: 静觅丨崔庆才的个人站点
Cover: https://cdn.cuiqingcai.com/prwgs.png
Created: "2026-06-26 00:20:53"
Description: 网络爬虫工程师面试小笔记 ————小企业，7K至10k版，面试总结。Payne 面试题之一：Python单例模式         什么是Python的单例模式？        单例模式（Singleton Pattern）是一种常用的软件设计模式，该模式主要目的是确保某一个类只有一个实例存在。当希望在整个系统中，某个类只能出现一个实例时，单例对象就派上用场了。 面向对象编程单例模式，保证了在程序运
Origin: 静觅
Tags:
    - Python
    - 单例模式
    - 面试
    - 设计模式
    - 爬虫工程师
Title: 网络爬虫工程师面试小笔记
Url: https://cuiqingcai.com/9484.html
tags:
    - Python
    - 单例模式
    - 面试
    - 设计模式
    - 爬虫工程师
updated: "2026-06-26T01:12:24+08:00"
publish: true
rid: "e2ff2ed1-2dab-475d-b9a3-17a219479a43"
permalink: "/r/e2ff2ed1-2dab-475d-b9a3-17a219479a43"
webClipUrl: "https://l4p-web-clips.pages.dev/r/e2ff2ed1-2dab-475d-b9a3-17a219479a43"
---


———— 小企业，7K 至 10k 版，面试总结。Payne

#### 面试题之一：Python 单例模式

##### 什么是 Python 的单例模式？

单例模式（Singleton Pattern）是一种常用的软件设计模式，该模式主要目的是 **确保某一个类只有一个实例存在**。当希望在整个系统中，某个类只能出现一个实例时，单例对象就派上用场了。 面向对象编程单例模式，保证了在程序运行中该类 **只实例化一次**，并提供了一个全局访问点 Python 的模块就是天然的单例模式 当模块在第一次导入时，就会生成 **.pyc** 文件 当第二次导入时就会 **直接先加载.pyc** 文件，而不会再次执行模块代码。 我们只需把相关函数和数据定义在一个模块中，就可以获得一个单例对象。

##### 如何实现单例模式？

###### 1\. 基于类：

```python
class Singleton(object):
    # def __new__(slef):类方法
        # pass 
        # 当我们没写时默认调用object__new__方法

    # 然后在执行类的实例化对象：__init__
  def __init__(self): # 实例方法
        pass

    @classmethod
    def instance(cls, *args,**kwargs):
        if not has attr(Singleton,"_instance"):
            Singleton._instance = Singleton(*args,**kwargs)
        return Singleton._intance
```

此时是以完成了一个简单的单例模式 **案例**，But 实际开发中随时凉凉 举例说明：

```
class Singleton(object):

    def __init__(self):
        pass

    @classmethod
    def instance(cls, *args, **kwargs):
        if not hasattr(Singleton, "_instance"):
            Singleton._instance = Singleton(*args, **kwargs)
        return Singleton._instance

import threading

def task(arg):
    obj = Singleton.instance()
    print(obj)

for i in range(10):
    t = threading.Thread(target=task,args=[i,])
    t.start()
```

当然此时也并没有什么问题，BUT 在’ init ‘方法中加入 I/O（input/output）操作就凉凉了 问题出现了，按照以上方式创建的单例无法支持 **多线程** 缘由：Python 中实例化对象与初始化对象是分开执行的，又由于多线程之间是通信共享的，故出现线程安全问题。主要体现为，create 一个之后 kill 一个，create 一个又被 kill 一个。所以就。。。 解决思路一：相互独立，分而治之。加锁独立 也就是咱们所了解、知道的线程锁的概念，使得其无序变为相对有序。具体代码便不在此赘述 在看看思路一 (相互独立，分而治之。加锁独立) 解决思路二：‘反’实例化，加锁保护独立，确保通用性 在 Python3 中，调用父类方法是为 super ()，那么是否可以增加判断： 当类属性不为空时，我们便不在实例化且返回一个 **已实例化** 的类属性。这样还是不太完美，带有局限性。进一步加锁保护优化以保障多线程情况下只有一个线程同时访问。这样就保障了单例的安全 **基于 new 方法实现！！！**

```markdown
在回到基于类的第一个代码块，并详细查看其注释。
实例化一个对象是先执行了类的__new__方法（若未写执行object.__new__），实例化对象；然后子啊执行类的__init__方法，对这个对象进行初始化。基于此实现单例。
```

###### 基于装饰器

使用装饰器实现，实例如下：

```ruby
def Singleton(cls):
    _instance = {}

    def _singleton(*args, **kargs):
        if cls not in _instance:
            _instance[cls] = cls(*args, **kargs)
        return _instance[cls]

    return _singleton

@Singleton
class A(object):
    a = 1

    def __init__(self, x=0):
        self.x = x

a1 = A(2)
a2 = A(3)
```

###### 使用模块的方法

书写代码 (并保存在 Singleton.py 中)：

```
class Singleton(object):
  def func(self):
        pass
singleton = Sinleton()
```

//from \* import singleton 需使用时，直接在其他文件中导入此文件中的对象，那么这个对象即是单例模式对象 还有个基于元类的就没书写了具体请看： [https://blog.csdn.net/weixin_44239343/article/details/89376796](https://blog.csdn.net/weixin_44239343/article/details/89376796)

#### 面试题之二：Redis 有几种数据类型？

如果是单单是 Redis 那么 **常用数据类型为五种** 他们分别是：String，List，hash，set，zset String：字符串，一个字符串 Value 最多可以是 512M Hash：哈希，是一个 String 类型的 field 和 Value 的映射表 List：列表，时间是链表 Set：集合是一个 String 类型无序无重复集合，其通过 Hash Table 实现 Zset（sorted）：有序集合 那么应聘时，请注意这个小坑，你 **Python** 使用 Redis 又几种数据类型？这个是基于语言来回答的，所用语言 + Redis 数据类型杂糅 Number,String，list，tuple（这个不确定），dict，aggregate 同时又涉语言所拥有的数据类型与 redis，一样的就 **‘合二为一’** 嘛 以 Python 为例，稍后继续探究这（6+5）之间的杂糅，dict 与 aggregate 其二者区别为主（其实我也不晓得更深的了）。以及 1 对 1，1 对多，多对 1。数据结构搞起来，然后哼哼～。

#### 面试题之三：Scrapy 框架的运行流程及各模块的作用

如果简历里面写了分布式会拓展 scrapy-Redis 架构以及其作用。 CAP 理论，估计会扯到数据这块。拓展 database 什么特性啊，之类的。谈优化，谈数据结构。反正数据结构与算法这块，基于此，难于此，也凉于此

#### 面试题之四：scrapy 去重所用的几种机制

谨记：先从 scrapy 本身的去重原理及机制说起来，最基础，优缺点，去重原理等等。一步步来，一上来就 BloonFilter，风险不小啊 对于此，自我总结如下：

1、scrapy 基于内存

```
scrapy源码中可以找到一个dupefilters.py去重器;

需要将dont_filter设置为False开启去重，默认是True，没有开启去重；

对于每一个url的请求，调度器都会根据请求得相关信息加密得到一个指纹信息，并且将指纹信息和set()集合中的指纹信息进 行 比对，如果set()集合中已经存在这个数据，就不在将这个Request放入队列中;
```

2、redis 基于内存 更加快捷、速度快、易于管理

```
不说了，前面是叩门砖，Redis就是决胜之地，没啥可讲的，会的基本都会，不会的我也不会，在深挖其原理数据结构，估计得喝上一点，也怕自己一不小心怕给扯飞了
```

3、布隆过滤器 大 可能存在拥有一定的错误率

```
加分项，是满分还是SSS+。
```

**对于此面试个人总结如下：** 源于基础，死于基础（数据结构及类型， 以及算法） 知识点：点串线，线成面。 自己也还有很长一段路走，加油，加油～