---
title: "【中文字幕】求平方、测量与优化，使用 C 语言实现"
source: "https://www.bilibili.com/video/BV1XS8w6rEfJ/"
platform: "bilibili"
video_id: "BV1XS8w6rEfJ"
uploader: "RookieOnline菜鸟在线"
duration_seconds: 2384
tags: ["显卡", "C语言", "编程", "RookieOnline菜鸟在线", "B站AI创造公开赛", "C/C++", "【中文字幕】", "Linux", "Coding"]
---

# 总结稿

暂无总结。

# 辅助理解

# Data

## 原始转写稿

[00:00] 好 guys welcome to today's show
[00:04] so in my last post I promised you more beginner friendly stuff
[00:13] so that's what I'm gonna do today
[00:18] today we're gonna code a program which will square two numbers
[00:23] so for instance we want to raise two to the power of eight
[00:28] and make it be 256
[00:32] because in most languages it's included in the main language
[00:37] a squaring function but not in C
[00:41] so we need to write our own or use an external library
[00:45] like a math library
[00:47] but we're gonna try to make a very simple version
[00:53] and measure the results
[00:57] so we're gonna run it a couple of times
[00:59] like ten thousand times or something
[01:02] and see the performance
[01:05] and then we're gonna see if we can improve it
[01:08] and optimize the code
[01:11] so that's a general idea
[01:13] the only thing I've done this far is this empty.c file
[01:18] and I'm starting out the way I usually do
[01:22] with lots of includes
[01:26] some integer data types that are defined
[01:29] and some aliases
[01:31] some macros which will convert between different integer types
[01:39] alright so let's start with the main
[01:41] because it's going to be pretty simple
[01:44] our main function
[01:46] what we want to have is a
[01:50] let's say an n32x
[01:54] which is going to be equal to
[01:58] let's say
[02:00] let's say we have a squaring function
[02:04] and we want to take two to the power of eight
[02:09] so we provide these two arguments
[02:12] and this is going to be run a lot of times
[02:16] and maybe we can even do the loop here
[02:22] so let's create some kind of counter
[02:31] we say 4c is equal to zero
[02:34] as long as c is less than
[02:39] let's say a hundred thousand times
[02:41] I think that will be fine
[02:46] this is the syntax
[02:51] so we want to do c++
[02:56] I'm going around this function
[03:00] we want to print the results
[03:06] so two to the power of eight
[03:11] is equal to this
[03:20] we cast the result to a regular integer like this
[03:25] by the way it should be x here
[03:30] and then we return
[03:31] so it's not going to be more complicated than that
[03:34] everything important is going to be
[03:38] inside of this function
[03:41] so if we were to make this
[03:45] some temporary empty function
[03:47] just so this will compile
[03:52] so we have in 32 squaring
[03:57] and we have in 32
[04:03] which we call this x maybe
[04:06] and this could be the exponent
[04:13] for now we will ignore this
[04:16] and just return 256
[04:21] I just want to see how this works
[04:25] so okay now I close it
[04:31] so let's compile this thing
[04:33] I have created a very simple
[04:36] standard make file
[04:37] which will just compile this very easily
[04:42] so oh
[04:46] I thought that was supported
[04:51] maybe I need to specify the inversion
[04:57] so if we say that this standard
[05:00] is c23
[05:04] will it be supported then
[05:08] okay now it works
[05:11] but if you have a very old GCC
[05:15] you cannot do this
[05:17] then you will just have to
[05:24] remove this thing here
[05:26] it's the only purpose
[05:29] is making it easier to read
[05:33] so it doesn't have any programmatic purpose
[05:42] so let's try our program
[05:47] it's almost instant
[05:49] even though we run it 100,000 times
[05:52] and it could be because
[05:54] c optimizes stuff away
[05:57] but I just want to show you
[06:00] that it runs
[06:01] and how we are going to measure it
[06:03] because instead of
[06:07] wearing too much about the low level
[06:11] stuff regarding measurements
[06:14] I have done an episode about that
[06:16] I can link in the description
[06:19] so I will just use the time command
[06:21] which is built into bash
[06:23] so here it says that it takes
[06:26] 0.003 seconds
[06:30] so I think she would have
[06:32] optimized this loop away
[06:34] if we were to specify
[06:36] that we want zero optimizations
[06:47] it should be fairly slow I think
[06:56] a little bit
[06:59] alright but
[07:01] it's gonna run 100,000 times anyway
[07:06] so let's do the actual implementation
[07:14] and let's make it as simple as possible
[07:19] I mean as easy to understand as possible
[07:23] at least in the first version
[07:27] so when we square
[07:30] let's say we have
[07:35] 2^3
[07:38] so what this means is
[07:40] we want to run 2*2*2
[07:45] so we need to have a loop
[07:48] where we times it with itself
[07:54] a specific number of times
[07:57] well e number of times
[08:03] so we need to have some kind of
[08:08] count right
[08:10] so let's say we have c
[08:13] and we need some kind of
[08:14] intermittent result
[08:18] let's say y
[08:24] alright
[08:25] so we make a for loop
[08:29] or maybe we can even make it a while loop
[08:31] to make stuff even easier to understand
[08:34] let's say while true
[08:41] and before we begin we set our
[08:45] temporary result to x
[08:48] so we start out with the value x
[09:00] we need to keep track of
[09:02] how many times we do this
[09:06] so this e here
[09:12] let's say we have an e'
[09:20] and we set our e'=e
[09:26] and then we decrease this
[09:28] once every time we run this thing
[09:33] so if our e=0
[09:39] we want to break out of this loop
[09:46] and otherwise
[09:49] we want to set e=e-1
[09:53] so if we have this
[09:57] 2^3
[09:58] it starts out with 3
[10:00] and goes down to 2 to 1 to 0
[10:03] and then we break
[10:04] alright
[10:09] ok
[10:10] so what do we want to do here
[10:13] we want to change the value of y
[10:17] so currently it is x
[10:21] and we want it to be equal to
[10:24] itself times x
[10:31] so first 2 times 2
[10:34] will be 4
[10:36] and next time 4 times 2
[10:40] will be 8
[10:46] and then we can simply return our y
[10:52] should be fairly easy to follow along
[10:56] let's see if i did this right
[10:58] because sometimes we need to
[11:01] make sure that we are not off by 1
[11:04] because it's very easy to be when we do it like this
[11:08] so let's run this
[11:10] and see our result
[11:12] ok we've reduced c
[11:16] let's remove it
[11:21] let's run this thing
[11:27] 512
[11:28] as i said
[11:30] we are off by 1
[11:31] we times it
[11:32] one time
[11:34] too many
[11:38] so how do we solve this
[11:46] i guess we want to stop
[11:49] when e is equal to 1
[11:55] and since we do this
[11:57] we want to make sure
[12:00] that e is not equal to 0
[12:02] because that's also an edge case
[12:05] we need to watch out with
[12:08] because let's say we have 5
[12:12] to the power of 0
[12:15] that should be equal to 1
[12:17] there's another edge case
[12:19] 5to the power of 1
[12:22] should be 5
[12:25] because 5 times
[12:28] well
[12:31] 5 times itself
[12:33] only one time
[12:36] it's just 5
[12:41] but i think our current code
[12:44] takes care of this second case
[12:47] we need to doublecheck that
[12:49] but the first case
[12:51] we need to worry about
[12:52] so if e is equal to 0
[12:58] let's just return 1 like this
[13:05] alright
[13:06] let's see what's happening
[13:11] 256
[13:12] ok so now it works
[13:15] let's also check if
[13:26] i've been going too much to summarize it
[13:31] so let's take this example
[13:33] 5to the power of 0
[13:45] and let's see if it works as intended
[13:52] ok that's good
[13:55] and what about
[13:57] 5to the power of 1
[14:00] ok so now everything works
[14:13] so let's see here
[14:23] so let's go back to the thing we had from the beginning
[14:37] and let's see how fast it is
[14:41] let's run time square
[14:52] i think it's still too fast
[14:54] i think it is somehow
[14:57] optimizing stuff
[15:13] it probably has some built-in function
[15:19] inside of the standard C
[15:22] runTimeLibrary which checks if we are calling the same function
[15:32] with the same arguments multiple times
[15:36] and if this is a so-called pure function
[15:45] which means that if we give it the same arguments
[15:50] it's going to produce the same result every time
[15:55] without any side effects like global variables or I/O
[16:03] in that case it probably saves the result somewhere in RAM
[16:07] and just the second time it runs
[16:10] it will just return that result instantly
[16:14] that's what I think anyway
[16:18] we could test this
[16:22] by let's see
[16:28] if we set C
[16:34] to 100,000
[16:43] and we check if C
[16:46] is more than 256
[16:54] C-minus and we provide
[17:00] more or equal to 8
[17:17] and we change this to C
[17:20] so now it's going to do 2 to the power of 100,000
[17:24] and then 2 to the power of 99,000
[17:29] 99,000
[17:32] and so on until C is equal to 8
[17:35] and it does 2 to the power of 8
[17:38] and that's where it's going to return
[17:44] so now I don't think it's going to be able to optimize this away
[17:58] it takes too long time
[18:03] let's give it a few seconds and see if it returns
[18:15] ok so 18 seconds
[18:20] it's a little bit too much I think
[18:24] so maybe we can start at 20,000
[18:31] so this should be approximately
[18:37] well 2 or 3 seconds result
[18:49] now it's too little
[18:51] we have a positive result at least
[18:59] so we have some good value to compare with
[19:14] ok this is good I think
[19:17] 3 seconds is a good time to wait
[19:24] it's not annoyingly slow
[19:28] and it still returns the correct result
[19:34] ok so how do we optimize this
[19:41] so first of all we can make our code a little bit more appealing
[19:46] because this while construction
[19:50] it's very easy to understand for beginners
[19:54] but it's not very good code I think
[19:59] so instead we can do a for loop
[20:04] and if you don't know how for works
[20:07] it's like a while loop
[20:09] it repeats the block of code inside it
[20:13] but it has 3 different parts
[20:15] first it has an initialization part
[20:18] where we set all the beginning variables
[20:23] like this
[20:25] so this will run once
[20:27] before everything else
[20:29] then we have the condition
[20:31] and here we just have a true condition
[20:34] so this will go on forever
[20:36] if we wouldn't explicitly break it one
[20:39] so how many times do you want to loop this
[20:45] well we want to loop it
[20:49] as long as e is more than 1
[20:55] because when it's 1 we want to break
[20:59] and what do we want to do
[21:02] between each iteration of the loop
[21:05] well we want to set e
[21:10] we can say minus equals
[21:12] that's the same as e is equal to itself minus 1
[21:17] so e minus equals 1
[21:20] and also we want to set y
[21:27] times equals x
[21:33] so this is what we want to do
[21:36] and this is all we want to do
[21:38] so we actually don't need any more code
[21:41] so we can close this loop with this
[21:44] and remove all of this
[21:47] so we basically took the whole function
[21:53] and made one line out of it
[21:55] the interesting part is
[21:57] will this be faster or slower
[22:00] so we had 3.2 seconds
[22:10] what would you guess
[22:12] faster slower
[22:14] perhaps the same
[22:31] I think it is slower
[22:34] unless we made a mistake
[22:38] and it never terminates
[22:41] let me double check the code
[22:44] so we set y equal to x
[22:51] and e prime is equal to e
[22:53] so this part is certainly ok
[22:57] and we want to iterate as long as
[23:00] e is more than 1
[23:03] so if we do 2 to the power of 8
[23:06] it's going to be 8
[23:10] at the beginning which should
[23:13] continue the loop
[23:17] and we set e equal to itself
[23:20] minus 1
[23:23] e each time it iterates
[23:27] and we set y equal to itself
[23:34] times x
[23:36] it is the same color, right?
[23:42] so why doesn't it terminate?
[23:52] interesting
[23:56] let's
[23:58] wait with this loop
[24:02] and just run this once for now
[24:09] and see if it terminates this time
[24:19] let's not care about that for now
[24:25] no
[24:27] even though we are only running the function once
[24:30] it still doesn't terminate
[24:32] so I have made a mistake somehow
[24:36] but where is my mistake
[24:43] maybe you have already spotted it
[24:49] ah
[24:54] we are changing e
[24:57] the original argument
[24:59] what we should change is e prime, right?
[25:03] ok
[25:07] that's good because now we have some trouble
[25:10] had some troubleshooting as well in this episode
[25:13] and now it works
[25:15] so let's restore the loop
[25:18] this should be times
[25:22] and see
[25:28] and let's see how fast it is
[25:30] so we had 3.2
[25:42] and now we have 3.1
[25:45] it's a teeny weeny bit faster
[25:51] the code however
[25:53] it's much more difficult
[25:57] to understand, right?
[25:59] this one liner
[26:01] however
[26:04] it's a matter of taste, sure
[26:06] but I think it's prettier
[26:09] in a way
[26:11] but it depends
[26:13] if you value this 0.1
[26:18] speed
[26:21] and the beauty
[26:25] or if you value the readability
[26:28] of the code
[26:32] alright
[26:33] so why is the tiny bit faster
[26:38] it basically performs the same operations, right?
[26:45] so I think
[26:47] the only thing that actually would translate
[26:50] to different machine code
[26:52] is this part
[26:54] where we do the compare
[26:58] of the condition
[27:02] in one line
[27:05] and before we had this y loop
[27:07] we did also have
[27:09] I mean this if statement
[27:12] with the break
[27:14] and we did also have the while true
[27:16] which also checks
[27:19] the condition every time
[27:23] alright
[27:25] so what else can we do?
[27:28] can we improve the speed somehow?
[27:32] so in order to do that
[27:35] we would have a lot of operations to play with
[27:39] so what can we really optimize?
[27:42] well this may be
[27:51] at times operation is pretty expensive
[27:56] when it comes to CPU cycles
[27:59] so one way to
[28:03] common code like this in general
[28:05] is to try to use stuff like
[28:08] shifts
[28:10] so bitwise operations
[28:15] because if we have x shifted by 2
[28:19] it meansshifted right by 2
[28:22] it means we are dividing it by 2
[28:30] and if we shift it by 3
[28:33] we are still dividing it by 2
[28:36] but we are dividing it by 2
[28:39] 3 times
[28:42] and before it was 2 times
[28:47] so yeah
[28:49] and same in the other direction
[28:52] like this
[28:54] so this will be
[29:01] x times
[29:04] 2 times2 times2
[29:08] because every shift to the left
[29:11] doubles the value
[29:16] and why is that?
[29:18] because at the bit level
[29:21] let's say we have something like this
[29:25] so this becomes 2
[29:27] this is 2in binary
[29:30] and if we shift it to the left
[29:32] we move it like this
[29:37] fill in the blanks with zeros
[29:40] so we
[29:44] and this is 4
[29:48] so that's why a bit shift is always like that
[29:53] and I think and could we do it
[29:55] the bit shifting somehow
[29:58] tricky part
[30:00] while 2 to the power of 8
[30:02] we certainly could do that way
[30:05] but other things to the power of stuff
[30:11] would probably be more difficult
[30:16] but since we are only doing it this way
[30:23] I guess we could at least try
[30:30] so let's see
[30:36] 2 to the power of 8
[30:42] that would shift it 8 times
[30:48] or 7 maybe
[30:53] let's try
[30:57] it might be interesting to see the results
[31:00] so maybe we should break
[31:03] this off a little bit
[31:05] so I at least can read the code myself
[31:12] so let's move this e stuff
[31:18] 2 to the power of 8
[31:23] 2 to the power of 8
[31:27] 2 to the power of 8
[31:32] and maybe this too actually
[31:49] and since we are making this function
[31:51] only work when x is 2
[31:55] let's make an assertion
[31:59] that the x is equal to
[32:02] so if it's not the program will exist
[32:11] so now we want to set
[32:16] let's see here
[32:24] we want to set y=the current value of y
[32:37] maybe we don't even need this loop now
[32:41] well if we just were to say
[32:43] y=xshifted left e times
[32:58] what would happen then
[33:03] let's do
[33:06] let's see
[33:11] let's keep this code like this
[33:16] so now we don't even have a loop
[33:24] all we have is this shift
[33:29] so let's see what happens
[33:32] let's remove this loop for now
[33:41] and see if we still get the correct result
[33:48] we don't need e anymore
[34:15] 512
[34:18] we are still off by one
[34:21] so what we really want to do here is
[34:24] e-1
[34:28] right
[34:36] so now it works
[34:39] and it should be fairly faster
[34:42] we have replaced this entire loop
[34:46] with just one operation
[34:52] so basically we are telling the CPU
[34:55] to do everything for us
[34:59] but will our edge cases still work
[35:04] so if we have times
[35:07] to the power of zero for instance
[35:11] OK, now what about one?
[35:41] OK, and just for the, I don't know what to say, but just to double check two to the power of two is four.
[36:01] OK, great, so now we have something which at least works when it comes to
[36:09] two to the power of something.Let's just check what happens if we say three to the power of two, because we are not supporting this.
[36:28] And as we can see, we get this error message that the assertion X is equal to two failed, aborted.
[36:37] And that's what our assert function does.It's good when debugging, but you should always remove it from the code that you're going to run professionally.
[36:49] OK, so let's go back to the loop.
[36:57] We had two to the power of C.
[37:12] And we had our current record is 3.1 seconds.
[37:23] Do you think this will be faster or slower?
[37:44] Do you think it will be faster or slower?
[37:49] Let's find out.Oh, look at this.Even though we are running it 40,000 times, it does it in 0.004 seconds.
[38:08] This is how you can easily measure results.This is how you can code squaring function in different ways in C and optimize it using bitwise operations in different kind of loops.
[38:27] So one good thing to take with you from this episode is that when you are performing mathematical operations, think through if you can do a more low level logical operation.
[38:48] Because that will be very very very much faster than iterating through a loop.
[38:55] We basically let the CPU do it for us in one single operation.
[39:03] OK,so I really hope you like this episode.Please don't forget to subscribe or even become a paying member.Click the join button.
[39:13] And thank you for watching.Thanks for tonight.
[39:25] Go to DrBerch.com/support.You can also click the button become a member.Thank you for your support.

## 原始关键帧

### 关键帧 1

![关键帧 1](assets/bilibili-BV1XS8w6rEfJ-frame-0001.webp)

### 关键帧 2

![关键帧 2](assets/bilibili-BV1XS8w6rEfJ-frame-0002.webp)

### 关键帧 3

![关键帧 3](assets/bilibili-BV1XS8w6rEfJ-frame-0003.webp)

### 关键帧 4

![关键帧 4](assets/bilibili-BV1XS8w6rEfJ-frame-0004.webp)

### 关键帧 5

![关键帧 5](assets/bilibili-BV1XS8w6rEfJ-frame-0005.webp)

### 关键帧 6

![关键帧 6](assets/bilibili-BV1XS8w6rEfJ-frame-0006.webp)

### 关键帧 7

![关键帧 7](assets/bilibili-BV1XS8w6rEfJ-frame-0007.webp)

### 关键帧 8

![关键帧 8](assets/bilibili-BV1XS8w6rEfJ-frame-0008.webp)

### 关键帧 9

![关键帧 9](assets/bilibili-BV1XS8w6rEfJ-frame-0009.webp)

### 关键帧 10

![关键帧 10](assets/bilibili-BV1XS8w6rEfJ-frame-0010.webp)
