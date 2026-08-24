---
title: "系统设计全解析：从API到生产级基础设施 | Hayk Simonyan"
source: "https://www.bilibili.com/video/BV1ktbq6SE3w/?share_source=copy_web&vd_source=b235e9c478ba07e2678b1ac01bb439c6"
platform: "bilibili"
video_id: "BV1ktbq6SE3w"
uploader: "地层世界"
duration_seconds: 7458
tags: ["数据库", "负载均衡", "缓存", "GraphQL", "CDN", "后端开发", "系统设计", "软件架构", "RESTful API", "API设计"]
rid: 155348fe-e5dd-4545-8ca8-3abd63d3189c
permalink: /r/155348fe-e5dd-4545-8ca8-3abd63d3189c
webClipUrl: https://l4place0.github.io/web-clips-publish/r/155348fe-e5dd-4545-8ca8-3abd63d3189c
---

# 总结稿

暂无总结。

# 辅助理解

# Data

## 原始转写稿

[00:00] A.I. is quickly changing software engineering,
[00:02] almost every engineer nowadays uses A.I. to write the code implementation,
[00:07] and we're moving towards agentic development,
[00:10] and companies also know this, which is why they are now prioritizing different skills in interviews,
[00:16] not only whether you can write the code implementation,
[00:19] but whether you understand the system and trade-offs at a high level,
[00:23] which is why the best skill you can learn nowadays is system design,
[00:27] how all these components talk to each other at a high level,
[00:30] how to design them from scratch,
[00:32] so in almost every tech interview,
[00:35] now there is a system design round,
[00:37] where they are testing your understanding on how systems actually work at a high level,
[00:42] and whether you can make architectural decisions at scale
[00:46] and articulate the trade-offs in systems you have built or worked on,
[00:51] and this is not only for interviews,
[00:53] even if you're not the one making all these decisions in your current role that you're working at,
[00:58] you still need to understand how the overall system functions,
[01:02] explain how components fit together in this system,
[01:05] and explain the trade-offs that were made while building the project,
[01:09] and that's exactly what we're going to cover in this full course,
[01:13] we're going to cover the skills that are proven at the senior level and beyond,
[01:17] these are the exact skills and concepts that got me into senior and to lead engineer position,
[01:24] and also helped many engineers pass interviews at senior and staff level and land new roles,
[01:30] so we're going to cover these in five steps,
[01:33] first we'll start with the foundations,which are the core concepts every engineer should know,
[01:38] then we'll get into API design,how to come up with contracts,versioning and communication patterns,
[01:44] and design APIs from scratch,
[01:46] then we'll get into databases,storage patterns,consistency and when to use which type of database,
[01:52] then we'll get into scaling,performance,caching,reliability,and handling points of failure in the system,
[01:59] and lastly we'll cover interviews on how to pass this system design interviews
[02:04] that are coming up at almost every position that you apply nowadays,
[02:09] and how to prepare for those,let's get started.
[02:12] designing a system to support millions of users is challenging,
[02:16] but every complex system starts with something simple,
[02:19] that's why in this lesson we'll build a basic setup that supports just one single user,
[02:24] and then we'll gradually expand it as we go,
[02:27] because starting small allows us to understand each core component before adding more complexity,
[02:32] so let's start with the first step and build a single server setup,
[02:36] imagine that we're setting up a system for a small user base,
[02:40] imagine that everything runs on one single server,
[02:43] the web application,the database,the cache,and also the other components,
[02:48] and this setup allows us to visualize the core workings without added complexity,
[02:53] now let's break down how this single server setup handles the user requests,
[02:57] we have some users who are trying to access our website or our API on the server,
[03:02] they can be either using the web browser or a mobile app to access our server,
[03:07] and on the other hand we have our server which has the necessary files to serve to the web browsers
[03:12] and also the necessary API endpoints to serve to the mobile app,
[03:16] and it is hosted on this example IP address,
[03:19] initially our users don't have this IP address,
[03:22] they have the domain which they are trying to access,let's say it's op.demo.com,
[03:27] so if they just type this domain name and hit enter,
[03:30] their web browser for example will contact the DNS which stands for domain name system,
[03:35] this is a provider which maps the domains to the IP addresses,
[03:39] and in our case let's say our domain name is mapped to the IP address
[03:43] which is the server's IP address that we have,
[03:46] so now this DNS provider will send the IP address back to the web browser
[03:51] or to the mobile app to our clients,
[03:53] and this IP address is our server's IP address,
[03:56] so now they have the location where they are trying to send requests,
[04:00] so with this IP address in hand the user's device sends an HTTP request to our server
[04:06] asking for specific data,and then our server processes this request
[04:10] and sends back the requested data,this might be an HTML page for a browser
[04:15] or a JSON response for the app depending on the request type,
[04:19] in this setup traffic usually originates from two main sources,
[04:23] the first one is the web applications and the second one is the mobile applications
[04:28] that are trying to access our server,
[04:31] for our web users the server handles the business logic,
[04:34] data storage,and also presentation using HTML,CSS,and JavaScript,
[04:39] and for mobile users communication typically happens over HTTP,
[04:43] this mobile apps request data from this server using API calls
[04:47] and JSON is often used for responses because it's lightweight
[04:51] and easy for mobile devices to interpret,
[04:54] here is an example API request that we can receive for our server,
[04:57] it can be a get request to our domain/product/the id of that product,
[05:02] and for this endpoint we need to retrieve the details of a product,
[05:06] and here is an example response that we might send back to the client,
[05:10] this is a JSON response which contains the product id,it contains the name of this product,
[05:15] some description,the price of the product,and some other metadata that is useful for the client,
[05:21] and then this will be used by the mobile app or by the web browser
[05:25] to display this product on the screen.
[05:28] and as we continue,our goal will be to identify areas
[05:31] where a single server might not be enough for the user demand,
[05:35] for now this setup is ideal for small user basis,but it may struggle under heavy traffic,
[05:41] so next we'll explore ways to scale each part of the system
[05:44] to support more users effectively.
[05:47] some key takeaways that we can have from this is that we need to start small,
[05:51] we need to begin with a straightforward single server setup
[05:55] to understand the essential components of system architecture,
[05:59] now we also understand how these requests flow through your system,
[06:03] which is fundamental for building more scalable systems,
[06:06] and we also recognize the unique demands for web and mobile applications
[06:10] and how they interact with your server,
[06:13] and in the next lessons we'll start looking at strategies
[06:16] for optimizing and scaling this setup.
[06:19] as our user base grows,a single server isn't enough to handle the increased demand
[06:23] and to accommodate more users,we can separate our web tier
[06:27] which is handling the web and mobile traffic
[06:30] and the data tier which is managing the database.
[06:33] this setup enables us to scale each server based on its specific load,
[06:37] but when it comes to choosing the right database,
[06:40] how do we know which specific database is the best for our specific application?
[06:44] when it comes to database selection,there are two main options,
[06:48] the first option is relational databases or rdbms
[06:52] which are structured in tables and rows,some popular examples are
[06:56] postgresql,myosql,oracle database or sql lite,
[07:00] on the other hand we have non-relational or no-sql databases,
[07:04] these are suited for applications that require flexibility
[07:08] and fast access to large volumes of unstructured data,some examples are
[07:12] Kassandra,mongodb,redis or neo4g,let's start by exploring
[07:17] the relational databases,these databases use structured query language
[07:22] or sql for finding and manipulating data,the data here is structured
[07:27] in tables which are the fundamental building blocks of sql databases
[07:31] and these are similar to spreadsheets,each table consists of columns
[07:35] which can be thought as the fields or attributes of the table
[07:39] and it also consists of rowswhich are single records within this table.
[07:43] for example if you imagine a customers table,within this table
[07:47] we can have columns like id,name,age and email,and for each rows
[07:51] we can have specific customers like the id of 1,2,3
[07:55] and the name will be john and the age will be 30 and so on
[07:59] but what are the advantages of using an sql database?
[08:03] first of all they support complex join operations across multiple tables
[08:07] for example if you imagine we have a customers table and also a products table
[08:11] and now we want to create a separate table that will connect the customers
[08:15] and the products that they have ordered.with sql
[08:19] you can join these two tables together into an orders table
[08:23] and this will hold the information about the customer id's who have this order
[08:27] and also the product id's which this customer has ordered
[08:31] and this process of combining two or more tables into one table
[08:35] are called join operations in sql.and the other big advantage
[08:39] is they provide robust data consistency and integrity
[08:43] especially for transactions.transactions in sql are a sequence
[08:47] of one or more sql operations that are performed as a single
[08:51] atomic unit and each transaction in sql follows the ACIT
[08:55] encronym.you can think of a transaction example like a bank transfer
[08:59] so first of all all of the transactions are atomic which means that the entire
[09:03] transaction is treated as a single unit which either completely succeeds
[09:07] or completely fails.each transaction is also consistent
[09:11] which means that it transforms the database from one valid state to another
[09:15] valid state.and they also come with isolation which means that modifications
[09:19] made by concurrent transactions are isolated from one another
[09:23] and they don't interfere with each other.and lastly they come
[09:27] with durability which means even if the system fails or the database
[09:31] server fails the data will still remain there.and now let's have a look
[09:35] at non-relational databases.non-relational databases can be
[09:39] in different forms for example we have document stores like MongoDB
[09:43] or you can use wide column stores like Cassandra,key-value stores
[09:47] like Redis,and graph stores like Neo4G.let's have a look
[09:51] at each of these types separately and let's start with the document stores
[09:55] MongoDB is the most popular example of a document store and the data
[09:59] here is stored in JSON like documents which allows us to have
[10:03] specialized data structures within a single record.next we have
[10:07] wide column stores where data is stored in tables rows and dynamic
[10:11] columns.some examples here are Cassandra or CosmosDB
[10:15] the main advantage of these databases is they can handle massive scales
[10:19] and are very good for many write operations.the other option
[10:23] is graph databases which focus on storing the entities and their relationships
[10:27] as graphs.an example of a graph database is Neo4G
[10:31] for example in Amazon they use the Neptune graph database
[10:35] which helps them to make you product recommendations based on your previous orders
[10:39] and the other popular type is key-value stores.here data
[10:43] is stored in key-value pairs.the biggest advantage of key-value stores
[10:47] is their simplicity and speed.since they're primarily stored in RAM
[10:51] reading and writing to these databases is extremely fast compared
[10:55] to other databases.some examples of key-value stores are
[10:59] Cash or Redis.so that's the main four types of NoSQL databases
[11:03] now let's have a look at the advantages of these NoSQL databases
[11:07] if you have a look at the same example that we had for the SQL databases
[11:11] where we have customers and products and we want to join them
[11:15] in orders.for example in MongoDB you could have this as a single
[11:19] document so you could store all of the user data also the orders
[11:23] and products in a single document.and because of this structure
[11:27] the NoSQL databases can handle highly dynamic and large datasets
[11:31] without the structure imposed by relational databases
[11:35] and also they are optimized for low latency and scalability
[11:39] so when should you use relational versus non-relational databases
[11:43] here is a quick comparison of both.if your application data is well structured
[11:47] with clear relationships then you should use SQL databases
[11:51] for example if you have an e-commerce application
[11:54] customers and orders.that's a good use case of using an SQL
[11:58] database.next if you need strong consistency and transactional
[12:02] integrity.for example if you have a financial application
[12:06] or banking system then you should use the SQL databases.however
[12:10] if your app demands super low latency for quick responses
[12:14] then you should go with non-relational databases.or if the data is unstructured
[12:18] or semi-structured like JSON objects and the relationships
[12:22] aren't that crucial.then you should also go with NoSQL databases
[12:26] and lastly if your application requires flexible and scalable storage
[12:30] for massive data volumes.for example a recommendation engine
[12:34] storing user activity data and key value format.then you should also go
[12:38] with NoSQL databases.let's explore the two primary
[12:42] approachings to scaling which are vertical and horizontal ways of scaling
[12:46] and we'll also see why horizontal scaling is generally more
[12:50] suitable for high-traffic applications.first we have the vertical
[12:54] scaling or sometimes it's also called scale up.this just
[12:58] means that we are adding more resources to our existing server
[13:02] meaning RAM,CPU,or any other resources that might help us
[13:06] to handle more traffic.and this approach is simple and works well
[13:10] for applications that have low or moderate traffic.however
[13:14] it comes with its limitations which are firstly resource limits
[13:18] there is a hardcap on how much you can add to a single server
[13:22] and eventually you will reach a limit on how much you can upgrade
[13:26] your new server.and the second reason is lack of redundancy
[13:30] meaning if this server goes down you don't have any other servers
[13:34] to serve your users.which means that your whole application goes down
[13:38] with your single server.on the other hand we have horizontal scaling
[13:42] which is also sometimes called scale out.in case of horizontal
[13:46] scaling we are just adding more servers to share the load
[13:50] so instead of having the single server we might replicate and have free of that
[13:54] same server.and now we can share that load between these servers
[13:58] instead of handling all of them in a single server.generally
[14:02] this is more suitable for large scale applications as it comes
[14:06] with higher fault tolerance.and higher fault tolerance means
[14:10] if one of our servers goes down we still have two servers available
[14:14] these two servers can continue serving our users while the second
[14:18] server recovers from the failure.and it also comes with better
[14:22] scalability because you can just add more servers as needed.instead
[14:26] of having free you might introduce a fourth one which will handle the new
[14:30] incoming traffic.but how do we implement horizontalscaling
[14:34] in case of a single server we know that all of our client requests went
[14:38] to the single server whether it's from mobile app or from the desktop
[14:42] but what if now we have free servers to handle all the load
[14:46] how do we distribute the client requests let's say our mobile app makes
[14:50] a request.how do we know where this request should go
[14:54] whether it should go to the server one or server two or two server three
[14:58] and seems like we need to have something in the middle which will direct the traffic
[15:02] to the appropriate servers.and that part in the middle
[15:06] is called a load balancer.we use load balancers to distribute
[15:10] the traffic across multiple servers.for example here we have free servers
[15:14] server one two and three.whenever we have a new
[15:18] request from the client the load balancer decides where we have the
[15:22] listload and then it redirects the traffic to that server
[15:26] and it also controls the fault tolerance meaning if one of our server goes
[15:30] down like the server three.it will stop sending traffic
[15:34] to the third server since it's not available anymore and it will send
[15:38] all of the traffic to server two and one until the server three
[15:42] is available again.and it also can make our app more scalable
[15:46] because we can introduce a new force server and any other servers
[15:50] that we want and this load balancer will ensure that all of the traffic
[15:54] is distributed evenly.so that's the two main approaches
[15:58] of scaling which are vertical and horizontal ways of scaling.in case
[16:02] of vertical scaling we are just adding more resources to our same
[16:06] server but in case of horizontal scaling we are adding more users
[16:10] to our server base and then we use a load balancer which distributes
[16:14] the traffic across multiple servers.but right now this load balancer
[16:18] is kind of a black box for us because we don't understand
[16:22] how does it work,how does it take the requests and how does it distribute
[16:26] the traffic.so let's explore that in the next lesson and let's see
[16:30] how this exactly works and what are the strategies that we use in load
[16:34] balancing.load balancers distribute the incoming traffic
[16:38] across multiple servers while also ensuring that no single server
[16:42] wares too much load.but how does it actually happen
[16:46] and how does the logic work of distributing the incoming traffic
[16:50] to understand load balancers better let's explore seven strategies
[16:54] and algorithms that are commonly usedin load balancing.let's start
[16:58] with round robin which is one of the most popular algorithms
[17:02] that's mainly because it's the simplest form of load balancing
[17:06] where each servers in the pool gets a request in sequential rotating order
[17:10] which basically means that the first request that it receives
[17:14] it directs it to the first server and the next request
[17:18] will go to the second server and the third one will go to the third server
[17:22] and once the last server is reached in this case
[17:26] it's the server free,it redirects it back to the first server
[17:30] and then again to the second server and so on.this works well
[17:34] for servers with similar specifications meaning if all of our
[17:38] free servers have the same capability then round robin will be
[17:42] a good choice here.next option is the least connections algorithm
[17:46] it directs traffic to the server with the fewest
[17:50] active connections.for example if we have ten active connections
[17:54] on the server one we have nine active connections on the server two
[17:58] and we have thirty active connections on the server three
[18:02] if it receives a new request from the client it will direct it to the server
[18:06] two because it has the least active connections at the moment
[18:10] so now it will have one more connection and this is particularly useful
[18:14] for applications where you have sessions of variable lengths
[18:18] meaning that one of your sessions might last ten minutes the other one might last
[18:22] one minute and so on and in this case the load balancer will take
[18:26] that into account and it will send the traffic to the least connections server
[18:30] the third option is least response time
[18:34] this algorithm is more focused on responsiveness of the servers
[18:38] let's say your first server is highly responsive the second one is low
[18:42] responsiveness and the third one is medium responsiveness
[18:46] in that case the load balancer chooses the lowest response time
[18:50] and with the fewest active connections meaning first it will try to send
[18:54] as many connections to the high responsive server as possible
[18:58] but it also takes into account the active connections
[19:02] let's say this server reaches thirty active connections
[19:06] then it will switch to the third server because this is the medium responsiveness server
[19:10] and it will send some traffic let's say twenty other requests to the medium responsiveness server
[19:14] and after that it will switch to the second server
[19:18] and it might send another ten requests to this third server until it redirects
[19:22] them back to the first server
[19:26] this is effective when the goal is to provide the fastest response time to requests
[19:30] and you also have different servers with different capabilities
[19:34] the fourth option is the IP hash algorithm
[19:38] which determines which server resists the request based on the hash of the client's IP address
[19:42] this is useful when you want your clients to consistently connect
[19:46] to the same serverlet's say client one makes a request to your load balancer
[19:50] the load balancer will use the client's IP address
[19:54] and based on this it will hash it and send it to appropriate server
[19:58] let's say server two and all of the future requests of the client one
[20:02] will go to the load balancer and it will use the same IP hashing algorithm
[20:06] and based on this IP address it will again redirect
[20:10] the user one requests to the server two
[20:14] this is useful if it's important for a client to consistently connect to the same application
[20:18] if every of your server has some information about the clients that are connected to it
[20:22] in that case the IP hashing is a good choice
[20:26] then there are also weighted algorithms
[20:30] these are variants of the above methods that can be also weighted
[20:34] for example you can have a weighted round robin or weighted list connections
[20:38] in this case servers are assigned two weights
[20:42] typically based on their capacity and performance metrics
[20:46] the third server has 16gb of RAM
[20:50] the second one has 32gb and the third one has 64gb
[20:54] based on the server RAM and other metrics they are assigned two weights
[20:58] and the load balancer takes that into account when redirecting the traffic
[21:02] first it will try to send as many connections to the third server
[21:06] as possible because it's more weighted meaning it has more performance
[21:10] and then it will try to send the other traffic to server two
[21:14] the last small portion will go to server one
[21:18] there are also geographical algorithms which are location based algorithms
[21:22] that direct requests to the server geographically closest to the user
[21:26] let's say this application is for US users
[21:30] so mostly users are connecting to this application from US
[21:34] but we also have some part of the users who are connecting from Europe
[21:38] and in our pool of servers we can have one server that is located in
[21:42] U.S. West and the last server
[21:46] can be located somewhere in Europe for the small base of users
[21:50] who are located in Europe so if a user comes from Europe
[21:54] and makes a request to this load balancer it will redirect this user
[21:58] to the server in Europe or if a user comes from US
[22:02] and makes a request to this load balancer it will check the location of this US user
[22:06] based on its IP address and then it will redirect either to the
[22:10] U.S. West or US West this type of load balancing is useful
[22:14] for global services where latency reduction is important
[22:18] and the last most popular type is consistent hashing
[22:22] in this case we use a hash function to distribute data across various
[22:26] noteswe have a hash function inside of a load balancer
[22:30] and we usually imagine a hash space along with this that forms
[22:34] a hash ring like a circle this hash function forms a circle
[22:38] where we have the servers for example the server 1 2 and 3
[22:42] which are located in front of this load balancer so whenever
[22:46] a new request comes from a user this hash function takes the
[22:50] IP address of that user and then based on that it locates this user
[22:54] on this hash ring let's say it locates it somewhere here
[22:58] and then depending to which server this point is closest to for example
[23:02] in this case this is closer to server 2 it redirects the traffic
[23:06] to that server this is a bit more complicated way
[23:10] of load balancing but it also ensures that the same client
[23:14] consistently connects to the same server like in case of IP hashing
[23:18] we also talked about that whenever a server goes down this load balancer
[23:22] insures that traffic is not redirected to that server
[23:26] but how does it know in the first place that this server is not available
[23:30] for that most load balancers come with health check features
[23:34] which means that they are consistently monitoring the servers by sending
[23:38] health check requests to all of these servers and they have the information
[23:42] about which servers are online let's say the first free servers are
[23:46] available and which ones are offline which means the fourth server
[23:50] which is offline so whenever it detects a failure in the health check
[23:54] it knows that this fourth server is not available anymore
[23:58] and basedon that information if the next request comes from the client
[24:02] it won't redirect them to the fourth server until the health check
[24:06] again succeeds and it knows that the fourth server is back online
[24:10] and now let's see some load balancer examples and what are these
[24:14] actually how do we implement them first we have software load balancers
[24:18] for example nginx is probably the most common type
[24:22] of the software load balancer it has other features
[24:26] and it's also used as a web server but it also offers the functionality
[24:30] of a load balancer typically you install this nginx
[24:34] on your server and then configure the servers that should be load balanced
[24:38] and also the algorithm and as you can see it also comes with health checks
[24:42] which i mentioned so you can set up health checks among your servers
[24:46] and then this will consistently monitor your servers and whenever
[24:50] one of your server goes down it won't redirect traffic to that server
[24:54] another example of a software load balancer is ajproxy
[24:58] which is an open source software that again you can install on your server
[25:02] and configure as you want but apart from software load balancers
[25:06] we also have hardware load balancers for example we have
[25:10] the f5 load balancer which is a widely used hardware load balancer
[25:14] known for its high performance and feature set
[25:18] next we have side tricks which also comes with load balancing functionality
[25:22] and again this is a hardware typeof load balancer
[25:26] if you don't want to configure all of that yourself on your server or as a hardware
[25:30] then the easier solutions are cloud based load balancers
[25:34] for example aws comes with elastic load balancing
[25:38] and if you have your servers also set up in aws
[25:42] then it's pretty easy to configure this with your servers
[25:46] and you can also see it in the benefits that it automatically comes with security,automatic scaling
[25:50] meaning that it will automatically add new servers to the pool
[25:54] it also comes with monitoring which is the same as health checks
[25:58] so you don't have to set it up yourself
[26:02] and other examples similar to aws are azure's load balancer
[26:06] and google cloud's load balancing
[26:10] now let's talk about the concept which is called a single point of failure in system design
[26:14] this is one part of your whole system that whenever it fails
[26:18] it will bring the entire system down with it
[26:22] put it simply it is any component that could cause the whole system
[26:26] to fail whenever it stops working
[26:30] for example if you imagine this setup when the clients connect to our load balancer
[26:34] and then load balancer distributes them to the apis
[26:38] and then we have a single database which is used for all apis servers
[26:42] database here is one example of a single
[26:46] point of failure whenever this database goes down
[26:50] all apis won't be able to connect to the database
[26:54] and because of that all of this also won't function properly
[26:58] and our clients won't be able to receive any response from the servers
[27:02] so having single points of failures in your system is problematic
[27:06] because they can create vulnerabilities
[27:10] the first obvious downside is the reliability
[27:14] because a single failure like the failure of this database can take the entire system down
[27:18] because users are not able to access our platform
[27:22] maybe they are also not able to access the checkout page
[27:26] or any other parts of the system which can bring losses in the business
[27:30] it is also an issue for scalability
[27:34] because systems that have single point of failures like this can often struggle
[27:38] to scale as each component will add a risk of failing this single part
[27:42] and the last part it also brings a security issue
[27:46] because if you have a single point of failure in your system like the load balancer
[27:50] attackers can compromise this point by sending huge traffic
[27:54] tweetand if this fails the whole system will go down
[27:58] we will talk about how to avoid the database single points of failure
[28:02] in the databases sectionbut in this section
[28:06] we can never look at how to avoid the load balancers to become a single
[28:10] point of failurebecause right now we have only one load balancer setup
[28:14] and if this load balancer goes down
[28:18] then all of our users won't be able to access this point
[28:22] and they will also not be able to access to our apis
[28:26] the first strategy is adding redundancy to our system
[28:30] this means that we can use more than one load balancer
[28:34] and for example if the second load balancer goes down users won't be able to connect to this load balancer
[28:38] but in that case we can redirect all of the traffic to the first one
[28:42] this first load balancer will balance the load between those servers
[28:46] and we will monitor the health of this second load balancer
[28:50] and whenever it's back online and it's again available
[28:54] we will also redirect 50% of the traffic to this second load balancer
[28:58] another strategy is to use health checks and monitoring
[29:02] for load balancers themselvesas we saw load balancer can
[29:06] do health checks for the serversand check whenever our servers are
[29:10] online or offlinewe can do the same strategy for load balancers
[29:14] and we can check their health continuously
[29:18] and whenever one of our load balancer goes down
[29:22] we will know that we shouldn't redirect any traffic to this load balancer until it is back online
[29:26] and the third common type is self-healing systems
[29:30] which means that we again monitor the health of our load balancer
[29:34] and if at any point we detect that it goes down
[29:38] it's a new load balancerwhich is basically an instance of this same load balancer
[29:42] and this way we won't cause any interruptions
[29:46] and our clients will be able to connect to this new load balancer
[29:50] Welcome to this section where you will learn the fundamental principles of
[29:54] API designwhich will enable you to create efficient scalable
[29:58] and also maintainable interfaces between software systems
[30:02] Here is what we are going to cover in this lesson
[30:06] What APIs are and what is their role in system architecture
[30:10] Then we will cover the three most commonly used API styles
[30:14] which are REST, GraphQL and GRPC
[30:18] We will discuss the four essential design principles that make great APIs
[30:22] and also how application protocols influence the API design decisions
[30:26] We will also cover the API design process
[30:30] so starting from the design phase to development phase to deployment
[30:34] So we will see how that process looks like
[30:38] So let's start by understanding what is an API
[30:40] API stands for Application Programming Interface
[30:44] which defines how software components should interact with each other
[30:48] Let's say on one side you have the client
[30:50] which is either the mobile phone or the browser of this user
[30:54] and on the other side you have the server which will be responding to the requests
[30:58] So API here is just a contract that defines these terms
[31:02] So what requests can be made
[31:04] So it provides us with an interface on how to make these requests
[31:08] meaning what endpoints do we have, what methods can we use and so on
[31:12] Also what responses can we expect from this server for a specific endpoint
[31:18] So first of all it is an abstraction mechanism
[31:22] because it hides the implementation details while exposing the functionality
[31:26] For example we can make a request to save a user data in this server
[31:30] But we don't care at all about how the logic applies behind the scenes inside of this server
[31:36] So we only care about the interface that is provided through this API
[31:40] And we only use that endpoint
[31:42] And we store the user without even knowing about the implementation details
[31:47] And it also sets the service boundaries
[31:50] Because it defines clear interfaces between systems and components
[31:54] So this allows us to have multiple servers
[31:57] We can have one server that is responsible for managing the users
[32:01] We can have another one that is responsible for some other records
[32:05] Let's say for managing the posts and so on
[32:08] So this allows different systems to communicate
[32:11] Regardless of their underlying implementation
[32:14] Like client browsers with servers or servers with another servers and so on
[32:19] Now let's focus on the most important API styles
[32:22] You will encounter during the design phase
[32:25] Restful, GraphQL, and GRPC
[32:28] The most common one out of these is REST
[32:31] which stands for Representational State Transfer
[32:34] These type of APIs use resource-based approach
[32:37] By using the HTTP methods as a protocol
[32:41] One of the advantages of REST APIs is that they are stateless
[32:45] Meaning that each request contains all of the information needed to process it
[32:49] And we don't need any prior requests to be able to process the current request
[32:54] And it uses the standard methods on HTTP protocol
[32:58] which are get for fetching data
[33:00] post for storing data
[33:02] put or patch for updating data
[33:04] and delete for deleting data
[33:06] So based on its characteristics
[33:09] the REST is most commonly used in web and mobile applications
[33:13] Next we have GraphQL
[33:15] which is the second most common API style after the REST APIs
[33:19] GraphQL is a query language that allows clients to request exactly what they need
[33:25] This means that it comes with a single endpoint for all of the operations
[33:29] and we can choose what we are expecting to receive from this API
[33:33] by providing the payload in the request
[33:36] And the operations here are called query
[33:39] whenever we are retrieving data or mutation
[33:42] whenever we are updating data
[33:44] This is the equivalent in put or patch or post in the RESTful APIs
[33:49] And there is also a subscription in operations
[33:53] which is for real time communication
[33:55] The advantage of GraphQL APIs is that it allows us to have minimal round trips
[34:00] Let's say we need some data that in RESTful APIs
[34:03] we will need to make free requests to get all of this data
[34:07] In GraphQL case we can make a single request
[34:10] and get all of this data
[34:12] The unnecessary two requests that we will otherwise have to make in RESTful
[34:17] And because of that this is the recommended option for complex UIs
[34:21] So wherever you have some complex UIs
[34:23] Where on one page you might need different data
[34:26] On another page you might need some other complex nested data
[34:29] In this case GraphQL is the better choice over RESTful APIs
[34:34] And the last option is gRPC
[34:36] I would say this is the least common one out of these three
[34:40] RPC is a high performance RPC framework
[34:43] which is using protocol buffers for communication
[34:46] The methods in gRPC are defined as RPCs in the proto files
[34:52] and it supports streaming and bi-directional communication
[34:56] This is an excellent approach for micro services
[34:59] especially and internal system communication
[35:02] as it is more efficient when you are working between servers
[35:05] compared to GraphQL or compared to RESTful APIs
[35:09] So the difference between REST GraphQL
[35:12] and gRPC APIs is kind of clear
[35:14] but let's also clarify the real difference
[35:17] between REST and GraphQL APIs on examples
[35:20] So as you saw REST comes with resource-based endpoints
[35:24] For example here if we take a look at these requests
[35:27] you can see that the resource here is users
[35:29] so you always expect to see some users endpoint
[35:33] or some followers endpoint or let's say posts endpoint
[35:36] so it is resource-based
[35:38] and sometimes we might need to make multiple requests
[35:41] for getting the related data
[35:43] as you can see here we need let's say the user details
[35:47] but we also need the user posts and followers
[35:50] so in this case we need to make free requests
[35:52] to get all of these data
[35:54] and it uses HTTP methods to define operations
[35:57] as you can see these are HTTP endpoints
[36:00] and we are using the GET method specifically
[36:03] and the response structures are fixed
[36:05] meaning if you got one response for this specific user
[36:08] next time you can expect to have exactly the same response structure
[36:12] maybe some data will be modified
[36:14] but the structure always remains the same
[36:17] and it also provides explicit versioning
[36:19] so as you can see it comes with v1 for the v1 API
[36:23] then later if it got a major upgrade
[36:25] then this will become v2 and so on
[36:28] and you can use the headers on the requests
[36:30] to leverage the HTTP caching on RESTful APIs
[36:35] now if we compare that to GraphQL APIs
[36:38] it comes with a single endpoint for all operations
[36:41] so mostly it is /graphql
[36:44] or /some API endpoint
[36:46] that is commonly used for all operations
[36:49] and in this case we will use a single request
[36:51] to get the precise data that we need
[36:54] and we will use the query language of GraphQL
[36:57] this is what the query language looks like
[37:00] as you can see we start with a query
[37:02] and then we define what we need
[37:04] the user with id 123
[37:06] then we need the name of the user
[37:08] the posts and then we define
[37:10] whatever we need from the posts
[37:12] maybe we need only title and content
[37:14] and nothing more
[37:16] and also the followers
[37:17] and what we need from followers
[37:19] maybe only names
[37:21] so this allows us to be more efficient
[37:23] in our requests compared to RESTful APIs
[37:25] where we will need to make free requests
[37:27] for this same data
[37:29] this means that client needs
[37:31] to specify the response structure
[37:33] and in this case
[37:35] the schema evolution is without versioning
[37:37] so here as you saw
[37:39] it is with v1 v2 and so on
[37:41] in this case the schema
[37:43] usually evolves without versioning
[37:45] but there is also a common pattern
[37:47] to start versioning the fields
[37:49] for example you can have followers v2
[37:52] and that will be the second
[37:54] type of followers schema
[37:56] but you can also go without versioning
[37:58] so you can just start modifying
[38:00] the followers or posts
[38:02] if you are sure that there are no
[38:04] other clients using your old API
[38:06] and in this case
[38:08] you can leverage the application level caching
[38:10] instead of the HTTP caching
[38:12] now let's discuss
[38:14] the major design principles
[38:16] that will allow us to create
[38:18] consistent, simple, secure
[38:20] and also performant APIs
[38:22] ultimately the best API
[38:24] is the one that we can use
[38:26] without even reading the documentation
[38:28] for example if you saw the previous
[38:30] endpoints in the users
[38:32] you see that we have /users/123
[38:34] and obviously
[38:36] we are expecting to get
[38:38] the user details of this specific user
[38:40] and if you make a request
[38:42] for example to that endpoint
[38:44] to fetch user details
[38:46] but then you find out that it also updates
[38:48] some followers or something
[38:50] while making this request
[38:52] then obviously that is a very bad type
[38:54] of APIas we didn't expect
[38:56] it to do such operations
[38:58] the good API should be consistent
[39:00] meaning it should use the consistent
[39:02] naming, caching, and patterns
[39:04] for example if you use
[39:06] camel case in one of the endpoints
[39:08] let's say you have user details
[39:10] and you do this in camel case
[39:12] but in another case
[39:14] you do it with a skinnake case
[39:16] like user/details
[39:18] then this is not common
[39:20] and this is not consistent
[39:22] the second key principle
[39:24] is to keep it very simple
[39:26] you have core use cases
[39:28] and intuitive design
[39:30] so you should minimize complexity
[39:32] and aim for designs
[39:34] that developers can understand quickly
[39:36] without even maybe reading the documentation
[39:38] and simplicity again comes down to this
[39:40] which is the best API
[39:42] is one that developers can use
[39:44] without even reading the documentation
[39:46] next obviously it has to be secure
[39:48] so you have to have
[39:50] some sort of authentication
[39:52] and authorization between users
[39:54] also if you have inputs
[39:56] then you need to make sure that these are validated
[39:58] and you should also apply rate limiting
[40:00] so these are the most basic
[40:02] things that you have to do
[40:04] to keep your API secure
[40:06] and the last pillar is performance
[40:08] so you should design for
[40:10] efficiency with appropriate caching
[40:12] strategies with pagination
[40:14] if you have a large amount of data
[40:16] let's say thousands of posts
[40:18] you don't want to retrieve all of this
[40:20] whenever they make a request
[40:22] to get the post
[40:24] so you should always have pagination
[40:26] with some limit and offset
[40:28] also the payloads
[40:30] meaning the data that you will send back
[40:32] should be minimized
[40:34] and also whenever possible
[40:36] you should reduce the round trips
[40:38] so if you have the opportunity
[40:40] to send some small data
[40:42] along with the request of one of the endpoints
[40:44] then it's better to do this
[40:46] if you know that you're going to use it
[40:48] instead of making another endpoint
[40:50] now each of these
[40:52] apis use different protocols
[40:54] and we will learn more about these
[40:56] in the next lesson
[40:58] but basically your protocol choice
[41:00] will fundamentally shape
[41:02] your API design options
[41:04] for example the features of
[41:06] http protocol directly enable
[41:08] restful capabilities
[41:10] so it makes more sense to use
[41:12] http along with restful apis
[41:14] because it also provides you
[41:16] with status codes and these are great
[41:18] with crowd operations
[41:20] that you will have in restful apis
[41:22] on the other hand websockets
[41:24] which is another type of protocol
[41:26] enable realtime data
[41:28] and also enable bi-directional apis
[41:30] so this can be used along
[41:32] with realtime apis
[41:34] wherever you need some chat application
[41:36] or some video streaming
[41:38] this is a good use case of websocket apis
[41:40] in case of GraphQL apis
[41:42] you again will use the
[41:44] http protocol instead of
[41:46] websockets or gRPC
[41:48] grpc on the other hand
[41:50] can be used among with
[41:52] microservices in your architecture
[41:54] to make it faster compared to
[41:56] http
[41:58] so your protocol choice will affect
[42:00] the API structure and also the performance
[42:02] and capabilities
[42:04] therefore you should choose it based on
[42:06] its limitations and strengths
[42:08] and the one that makes more sense
[42:10] in the type of API that you
[42:12] will be developing
[42:14] to discuss the API design process
[42:16] it all starts with understanding
[42:18] the requirements which is identifying
[42:20] core use cases and user stories
[42:22] that you will need to develop
[42:24] also defining the scope
[42:26] and boundaries because
[42:28] if it's a huge api
[42:30] then you probably won't develop all of
[42:32] the features at once so you should
[42:34] scope it to some specific features
[42:36] that you will be developing
[42:38] and also what are out of scope for now
[42:40] then you should determine the
[42:42] performance requirements
[42:44] and specifically in your api case
[42:46] what will be the bottlenecks
[42:48] and where you need to make sure
[42:50] that it's performant
[42:52] and you should also not overlook
[42:54] the security constraints so you should
[42:56] implement all of the basic features
[42:58] like authentication,authorization
[43:00] the rate limiting but maybe some more
[43:02] stuff depending on the api
[43:04] that you will develop
[43:06] when it comes to design approaches
[43:08] there are couple of ways to go about it
[43:10] the top-down approach which is
[43:12] you start with high-level requirements
[43:14] and workflows this is more common
[43:16] in interviews where they give you
[43:18] the requirements on what the api
[43:20] will be about and then you
[43:22] start defining what the endpoints
[43:24] will be what the operations
[43:26] will be and so on
[43:28] but there is also the bottom-up approach
[43:30] which is if you have existing data models
[43:32] and capabilities
[43:34] then you should design the api
[43:36] based on this so this is more common
[43:38] when you are working in a company
[43:40] and they already have their data models
[43:42] and capabilities of their apis
[43:44] so you should take that into account
[43:46] when designing the api
[43:48] and we also have contract
[43:50] first approach which is you define
[43:52] the api contract before implementation
[43:54] meaning what the requests
[43:56] should look like and what the
[43:58] responses should look like
[44:00] and this is more similar to top-down
[44:02] approach and this is also commonly used
[44:04] in interviews
[44:06] if you have to lifecycle management of apis
[44:08] it starts with the design phase
[44:10] where you design the api
[44:12] discuss the requirements
[44:14] and the expected outcomes
[44:16] of the api
[44:18] and only after that you can start
[44:20] the development and maybe local
[44:22] testing of your api
[44:24] after that you usually deploy
[44:26] and monitor it so you do some more
[44:28] testing but now on staging
[44:30] or on production
[44:32] but then it also comes the maintenance phase
[44:34] and this is why it's important
[44:36] to develop it with keeping
[44:38] the simplicity in place
[44:40] so it will be easier for you to maintain
[44:42] or for other developers to maintain
[44:44] in the future
[44:46] and lastly apis also go through
[44:48] deprecation and retirement phase
[44:50] so some apis eventually get
[44:52] deprecated because there might come up
[44:54] a new version of the api
[44:56] that you should use or let's say
[44:58] you are transitioning from v1
[45:00] to v2 api
[45:02] deprecation phase of the v1 api
[45:04] so developing apis
[45:06] is not only in the development phase
[45:08] as you might assume
[45:10] it's not just coding
[45:12] so the big part of it is designing it
[45:14] and also keeping it maintainable
[45:16] and also eventually you might
[45:18] need to retire it at the end
[45:20] so let's recap and see
[45:22] what our next steps are
[45:24] we learned what apis are
[45:26] and about the most dominant
[45:28] free type of apis styles
[45:30] for example, graphql
[45:32] and grpc
[45:34] we've covered the 4 key principles
[45:36] that will guide us when creating apis designs
[45:38] effectively
[45:40] and you now also understand how
[45:42] the design choice of your protocol
[45:44] will influence the design of your api
[45:46] and also the whole apis
[45:48] design process from start to finish
[45:50] but we didn't discuss the limitations
[45:52] and strengths
[45:54] of these apis protocols
[45:56] so that's why in the next lesson
[45:58] we'll learn all about the api protocols
[46:00] that we can use with apis design
[46:02] and which one we should choose
[46:04] based on the requirements of our apis
[46:06] choosing the wrong protocol for our apis
[46:08] can lead to
[46:10] performance bottlenecks
[46:12] and also limitations in functionality
[46:14] that's why we need to first understand these protocols
[46:16] which will allow us to build apis
[46:18] that meet our specific user requirements
[46:20] for latency
[46:22] throughput and also interaction patterns
[46:24] that's why in this lesson
[46:26] we'll cover the role of api protocols
[46:28] in the network stack
[46:30] the 2 fundamental protocols
[46:32] which are http and https
[46:34] and also their relationship
[46:36] to apis
[46:38] also another common type of protocol
[46:40] which is web socket for realtime communication
[46:42] we'll also cover
[46:44] advanced message queuing protocol
[46:46] which is commonly used for
[46:48] asynchronous communication
[46:50] and lastly we'll cover the grpc
[46:52] which is google's remote procedure call
[46:54] and it is also another common type of protocol
[46:56] used commonly within servers
[46:58] let's start by understanding
[47:00] the application protocols
[47:02] in network stack
[47:04] application layer protocols
[47:06] see it at the top of network stack
[47:08] building on top of protocols
[47:10] like tcp and udp
[47:12] which are at a transport layer
[47:14] these protocols at application layer
[47:16] define the message formats
[47:18] and structures
[47:20] also the request response patterns
[47:22] and management of the connections
[47:24] and error handling
[47:26] now below that we have many other
[47:28] layers like the network layer
[47:30] or data link layer
[47:32] or even physical layers
[47:34] but when building apis we are mostly
[47:36] concerned with api layer protocols
[47:38] which are http, https, web sockets
[47:40] and so on
[47:42] the most common type of protocol
[47:44] and also the foundation
[47:46] of web apis is http
[47:48] which stands for hypertext transfer protocol
[47:50] this is the typical interaction
[47:52] between client and server
[47:54] when they are interacting over http
[47:56] as you can see client always sends a request
[47:58] and they define the method
[48:00] which can be get, post or other methods
[48:02] and they define the resource URL
[48:04] which can be at /api /products
[48:06] let's say they are requesting data
[48:08] for this specific id of the product
[48:10] and they also define the version
[48:12] of the http protocol
[48:14] that they are using
[48:16] they also define the host
[48:18] which is the domain of your server
[48:20] where the information
[48:22] is accessedand usually
[48:24] they also authenticate before accessing
[48:26] any resources so it can be
[48:28] either a bearer token or a basic
[48:30] authentication or off and so on
[48:32] so once the request
[48:34] is authenticated in the server
[48:36] it receives the response
[48:38] which is in similar format
[48:40] and it's in http response
[48:42] so you get the http version
[48:44] which is again the same as you requested with
[48:46] and the status code
[48:48] which can be 200 if it was successful
[48:50] or it can be 400 if the client
[48:52] was error or 500
[48:54] if the error happened in server and so on
[48:56] you receive the content type
[48:58] which can be usually application json
[49:00] but it can also be a static
[49:02] web page or something else
[49:04] and there are many other headers
[49:06] that you can control
[49:08] like controlling cache you can use
[49:10] the cache control header or some other properties
[49:12] but these are the main things
[49:14] that you would notice in http
[49:16] request response cycles
[49:18] now when it comes to methods
[49:20] you have get for retrieving data
[49:22] post for creating data in the server
[49:24] put or patch for updating
[49:26] data partially or fully
[49:28] and delete for removing
[49:30] data from the server
[49:32] and when it comes to status codes
[49:34] which are received by the server
[49:36] so you have 200 series
[49:38] which are successful cases
[49:40] you have 300 for redirection
[49:42] and the client made an error in the request
[49:44] so this is an issue from client side
[49:46] or 500 which means that server
[49:48] made an error or like some error
[49:50] happened in the server
[49:52] which means that this is the issue in this server
[49:54] and these are the common headers
[49:56] like content type which is defined
[49:58] by the server usually but also from the client
[50:00] authorization
[50:02] for making a request and
[50:04] authorizing to the server
[50:06] accept headers, cache control, user agent
[50:08] and there are more headers but these are the
[50:10] common ones
[50:12] then we also have HTTPS
[50:14] which is basically the same HTTP protocol
[50:16] but with some sort of TLS
[50:18] or SSL encryption
[50:20] which means that our data is now
[50:22] protected in transit when we are making
[50:24] requests so it adds a security
[50:26] layer through this TLS
[50:28] or SSL certificates and encryption
[50:30] and it protects data in the transit
[50:32] and benefits of HTTPS
[50:34] is obviously your data is encrypted
[50:36] in the transit
[50:38] data integrity and you also authenticate
[50:40] users before providing any data
[50:42] and it also adds
[50:44] SEO benefits and you have many risks
[50:46] when you are using HTTP only
[50:48] without any encryption
[50:50] so the golden standard is to always use
[50:52] HTPS in servers
[50:54] the next type of protocols
[50:56] are web sockets
[50:58] while we have HTTP which is very good at
[51:00] request-response patterns
[51:02] sometimes HTTP has limitations
[51:04] for example let's say you are pulling
[51:06] some data let's say this is a user chat
[51:08] so you have the client and server
[51:10] on the client side you have the user chat
[51:12] and on the server you have the messages
[51:14] between two users
[51:16] when one of the users messages
[51:18] the other it sends a request
[51:20] to the server to notify that
[51:22] a message has been sent
[51:24] and it receives a response from the server
[51:26] maybe the messages from the other users
[51:28] if they are any
[51:30] and then next time if you need to know
[51:32] if you have new messages
[51:34] to make again another request
[51:36] to the server
[51:38] and maybe you don't have any new messages
[51:40] so you will receive an empty response
[51:42] with no new data
[51:44] so this was basically a non-necessary
[51:46] request-response cycle
[51:48] and you might request from some other time
[51:50] let's say from one minute
[51:52] and receive a response
[51:54] now you have some messages
[51:56] but it can be also empty again
[51:58] so this way is not ideal
[52:00] for real time communication
[52:02] and you have some bandwidth
[52:04] with making requests that are empty
[52:06] and you also use the server resources
[52:08] without the need of making request
[52:10] to the server
[52:12] and for such cases we have web sockets
[52:14] which solve this issue
[52:16] so in web socket you have usually
[52:18] a handshake that is happening
[52:20] within the first request
[52:22] and now you have both like two side
[52:24] communicationbetween client and the server
[52:26] which means that once the handshake
[52:28] is been made the server can
[52:30] decide to push data to the client
[52:32] let's say now you have two new messages
[52:34] on the server
[52:36] so server can decide to send this messages
[52:38] to the client without even client
[52:40] requesting for it
[52:42] but client can still request data
[52:44] so if client needs some external
[52:46] data or more data from the server
[52:48] it can still make requests
[52:50] but server is now also able
[52:52] to independently push data to the client
[52:54] so this is what unlocks
[52:56] the real time data with minimal
[52:58] latency as soon as you have some
[53:00] new data in the server it
[53:02] pushes the new data to the client
[53:04] and it also reduces the bandwidth
[53:06] usage by allowing bi-directional
[53:08] communication
[53:10] in client server model with HTTP
[53:12] you would make let's say new requests
[53:14] per 5 seconds or 10 seconds
[53:16] to see if there are any new data
[53:18] in the server but in this scenario
[53:20] you don't make any more requests
[53:22] other than the first one
[53:24] and now whenever there are new data
[53:26] server will push it
[53:28] and whenever there are no data
[53:30] to be requested then you don't need
[53:32] to make unnecessary requests
[53:34] to the server
[53:36] the next very common type of protocol
[53:38] is advanced message queuing protocol
[53:40] which is an enterprise messaging protocol
[53:42] used for message queuing
[53:44] and guaranteeing delivery
[53:46] in this setup you usually have the producer
[53:48] which can be either a web service
[53:50] or payment system
[53:52] or something like that
[53:54] you have the consumer which can be
[53:56] the processor of the payments
[53:58] or notification systems
[54:00] and stuff like that
[54:02] so a producer publishes messages
[54:04] to the message broker and here is
[54:06] where you have the advanced message queuing protocol
[54:08] you have queues in the middle
[54:10] let's say one of these queues
[54:12] is for order processing
[54:14] so whenever a new order has been placed
[54:16] producer publishes a message
[54:18] to this queue and then whenever
[54:20] this consumer is free
[54:22] it will pull messages from this queue
[54:24] and start updating the inventory
[54:26] and data in the database
[54:28] this allows the consumer to
[54:30] only pull data from here
[54:32] whenever it has capacity
[54:34] and whenever this consumer is busy
[54:36] with some other tasks it leaves the message
[54:38] in the queue and then later on
[54:40] whenever it has some free capacity
[54:42] it will pull the message and start
[54:44] updating the data
[54:46] and when it comes to exchange types
[54:48] you have direct one-on-one exchange
[54:50] you have direct one-on-one exchange
[54:52] you have a direct one-on-one exchange
[54:54] you have a direct one-on-one exchange
[54:56] you have a direct one-on-one exchange
[54:58] you have a direct one-on-one exchange
[55:00] you have a direct one-on-one exchange
[55:02] you have a direct one-on-one exchange
[55:04] you have a direct one-on-one exchange
[55:06] you have a direct one-on-one exchange
[55:08] you have a direct one-on-one exchange
[55:10] you have a direct one-on-one exchange
[55:12] you have a direct one-on-one exchange
[55:14] you have a direct one-on-one exchange
[55:16] you have a direct one-on-one exchange
[55:18] you have a direct one-on-one exchange
[55:20] you have a direct one-on-one exchange
[55:22] you have a direct one-on-one exchange
[55:24] you have a direct one-on-one exchange
[55:26] you have a direct one-on-one exchange
[55:28] you have a direct one-on-one exchange
[55:30] you have a direct one-on-one exchange
[55:32] you have a direct one-on-one exchange
[55:34] you have a direct one-on-one exchange
[55:36] you have a direct one-on-one exchange
[55:38] you have a direct one-on-one exchange
[55:40] you have a direct one-on-one exchange
[55:42] you have a direct one-on-one exchange
[55:44] you have a direct one-on-one exchange
[55:46] you have a direct one-on-one exchange
[55:48] you have a direct one-on-one exchange
[55:50] you have a direct one-on-one exchange
[55:52] you have a direct one-on-one exchange
[55:54] you have a direct one-on-one exchange
[55:56] you have a direct one-on-one exchange
[55:58] you have a direct one-on-one exchange
[56:00] you have a direct one-on-one exchange
[56:02] you have a direct one-on-one exchange
[56:04] you have a direct one-on-one exchange
[56:06] you have a direct one-on-one exchange
[56:08] you have a direct one-on-one exchange
[56:10] you have a direct one-on-one exchange
[56:12] you have a direct one-on-one exchange
[56:14] you have a direct one-on-one exchange
[56:16] you have a direct one-on-one exchange
[56:18] you have a direct one-on-one exchange
[56:20] you have a direct one-on-one exchange
[56:22] you have a direct one-on-one exchange
[56:24] you have a direct one-on-one exchange
[56:26] you have a direct one-on-one exchange
[56:28] you have a direct one-on-one exchange
[56:30] you have a direct one-on-one exchange
[56:32] you have a direct one-on-one exchange
[56:34] you have a direct one-on-one exchange
[56:36] you have a direct one-on-one exchange
[56:38] you have a direct one-on-one exchange
[56:40] you have a direct one-on-one exchange
[56:42] you have a direct one-on-one exchange
[56:44] you have a direct one-on-one exchange
[56:46] you have a direct one-on-one exchange
[56:48] you have a direct one-on-one exchange
[56:50] you have a direct one-on-one exchange
[56:52] you have a direct one-on-one exchange
[56:54] you have a direct one-on-one exchange
[56:56] you have a direct one-on-one exchange
[56:58] you have a direct one-on-one exchange
[57:00] you have a direct one-on-one exchange
[57:02] you have a direct one-on-one exchange
[57:04] you have a direct one-on-one exchange
[57:06] you have a direct one-on-one exchange
[57:08] you have a direct one-on-one exchange
[57:10] you have a direct one-on-one exchange
[57:12] you have a direct one-on-one exchange
[57:14] you have a direct one-on-one exchange
[57:16] you have a direct one-on-one exchange
[57:18] you have a direct one-on-one exchange
[57:20] you have a direct one-on-one exchange
[57:22] you have a direct one-on-one exchange
[57:24] you have a direct one-on-one exchange
[57:26] you have a direct one-on-one exchange
[57:28] you have a direct one-on-one exchange
[57:30] you have a direct one-on-one exchange
[57:32] you have a direct one-on-one exchange
[57:34] you have a direct one-on-one exchange
[57:36] you have a direct one-on-one exchange
[57:38] you have a direct one-on-one exchange
[57:40] you have a direct one-on-one exchange
[57:42] you have a direct one-on-one exchange
[57:44] you have a direct one-on-one exchange
[57:46] you have a direct one-on-one exchange
[57:48] you have a direct one-on-one exchange
[57:50] you have a direct one-on-one exchange
[57:52] you have a direct one-on-one exchange
[57:54] you have a direct one-on-one exchange
[57:56] you have a direct one-on-one exchange
[57:58] you have a direct one-on-one exchange
[58:00] you have a direct one-on-one exchange
[58:02] you have a direct one-on-one exchange
[58:04] you have a direct one-on-one exchange
[58:06] you have a direct one-on-one exchange
[58:08] you have a direct one-on-one exchange
[58:10] you have a direct one-on-one exchange
[58:12] you have a direct one-on-one exchange
[58:14] you have a direct one-on-one exchange
[58:16] you have a direct one-on-one exchange
[58:18] you have a direct one-on-one exchange
[58:20] you have a direct one-on-one exchange
[58:22] you have a direct one-on-one exchange
[58:24] you have a direct one-on-one exchange
[58:26] you have a direct one-on-one exchange
[58:28] you have a direct one-on-one exchange
[58:30] you have a direct one-on-one exchange
[58:32] you have a direct one-on-one exchange
[58:34] you have a direct one-on-one exchange
[58:36] you have a direct one-on-one exchange
[58:38] you have a direct one-on-one exchange
[58:40] you have a direct one-on-one exchange
[58:42] you have a direct one-on-one exchange
[58:44] you have a direct one-on-one exchange
[58:46] you have a direct one-on-one exchange
[58:48] you have a direct one-on-one exchange
[58:50] you have a direct one-on-one exchange
[58:52] you have a direct one-on-one exchange
[58:54] you have a direct one-on-one exchange
[58:56] you have a direct one-on-one exchange
[58:58] you have a direct one-on-one exchange
[59:00] you have a direct one-on-one exchange
[59:02] you have a direct one-on-one exchange
[59:04] you have a direct one-on-one exchange
[59:06] you have a direct one-on-one exchange
[59:08] you have a direct one-on-one exchange
[59:10] you have a direct one-on-one exchange
[59:12] you have a direct one-on-one exchange
[59:14] you have a direct one-on-one exchange
[59:16] you have a direct one-on-one exchange
[59:18] you have a direct one-on-one exchange
[59:20] you have a direct one-on-one exchange
[59:22] you have a direct one-on-one exchange
[59:24] you have a direct one-on-one exchange
[59:26] you have a direct one-on-one exchange
[59:28] you have a direct one-on-one exchange
[59:30] you have a direct one-on-one exchange
[59:32] you have a direct one-on-one exchange
[59:34] you have a direct one-on-one exchange
[59:36] you have a direct one-on-one exchange
[59:38] you have a direct one-on-one exchange
[59:40] you have a direct one-on-one exchange
[59:42] you have a direct one-on-one exchange
[59:44] you have a direct one-on-one exchange
[59:46] you have a direct one-on-one exchange
[59:48] you have a direct one-on-one exchange
[59:50] you have a direct one-on-one exchange
[59:52] you have a direct one-on-one exchange
[59:54] you have a direct one-on-one exchange
[59:56] you have a direct one-on-one exchange
[59:58] you have a direct one-on-one exchange
[60:00] you have a direct one-on-one exchange
[60:02] you have a direct one-on-one exchange
[60:04] you have a direct one-on-one exchange
[60:06] you have a direct one-on-one exchange
[60:08] you have a direct one-on-one exchange
[60:10] you have a direct one-on-one exchange
[60:12] you have a direct one-on-one exchange
[60:14] you have a direct one-on-one exchange
[60:16] you have a direct one-on-one exchange
[60:18] you have a direct one-on-one exchange
[60:20] you have a direct one-on-one exchange
[60:22] you have a direct one-on-one exchange
[60:24] you have a direct one-on-one exchange
[60:26] you have a direct one-on-one exchange
[60:28] you have a direct one-on-one exchange
[60:30] you have a direct one-on-one exchange
[60:32] you have a direct one-on-one exchange
[60:34] you have a direct one-on-one exchange
[60:36] you have a direct one-on-one exchange
[60:38] you have a direct one-on-one exchange
[60:40] you have a direct one-on-one exchange
[60:42] you have a direct one-on-one exchange
[60:44] you have a direct one-on-one exchange
[60:46] you have a direct one-on-one exchange
[60:48] you have a direct one-on-one exchange
[60:50] you have a direct one-on-one exchange
[60:52] you have a direct one-on-one exchange
[60:54] because if some information was cut in the middle
[60:57] or let's say you're in a call with someone
[60:59] and their internet connection locks
[61:01] you don't need to receive that old connection
[61:04] or the old data on what they said
[61:06] because you are in the call right now
[61:08] so UDP is the go-to for video calls
[61:11] online games or live streams
[61:13] because if one of these packets drops
[61:15] it's still fine
[61:16] and you don't need to go back
[61:18] and re-send this packet
[61:20] you can just move on and send the next packets
[61:23] this is what the three-step handshake
[61:25] looks like in TCP
[61:27] as you can see the first step is that client
[61:29] sends a request to the server
[61:31] in the second step server syncs
[61:33] and acknowledges the request
[61:35] and in the first step the client
[61:37] acknowledges the server
[61:39] and this is where the connection is established
[61:41] between the client and server
[61:43] and now they can start sending data
[61:45] back and forthon top of this TCP protocol
[61:48] so in short TCP is the safer
[61:51] and reliable version of UDP
[61:53] but it is slower
[61:55] and on the other hand UDP is faster
[61:57] and lightweight
[61:59] but it is risky
[62:00] for example if one of the packets
[62:02] in between the source and destination is lost
[62:04] it doesn't re-send it
[62:06] so there is no guaranteed delivery
[62:08] but on the other hand if in TCP
[62:10] one of the packets is lost
[62:12] after some time out
[62:13] it still resends the third packets
[62:15] and this way it guarantees
[62:17] that all data will be delivered
[62:19] compared to UDP
[62:21] where some data might be lost
[62:22] but it will still keep going
[62:24] and when choosing between those two
[62:26] these are the main things
[62:27] that you need to look for
[62:29] if you need the connection
[62:30] to be safe and reliable
[62:32] then you need to go with TCP
[62:34] or if you need it to be fast lightweight
[62:36] but some data loss might be acceptable
[62:38] then you will need to go with UDP
[62:40] for example it is best
[62:42] for using TCP in bankings
[62:44] emails,payments and so on
[62:46] and on the other hand UDP
[62:48] is mostly used in video streaming
[62:50] streaming,gaming and so on
[62:52] these are the main things
[62:54] that you need to know about
[62:56] application and transport layers
[62:58] and these are the only layers
[63:00] that will need to be used
[63:01] to building APIs
[63:03] and in the next lesson
[63:05] we will learn about restful APIs
[63:07] and how we usually design APIs
[63:09] in restful format
[63:11] restful APIs let different parts
[63:13] of a system talk to each other
[63:15] using the standard HTTP methods
[63:17] they are the most common way
[63:19] developers build
[63:20] and consume APIs today
[63:22] and in this video
[63:23] you will learn how to design
[63:24] clean rest APIs
[63:25] by following the proven best practices
[63:28] so that you avoid creating messy
[63:30] and inconsistent patterns
[63:32] that make the APIs
[63:33] hard to use and maintain
[63:35] we will start by learning about
[63:37] architectural principles
[63:39] and constraints of restful APIs
[63:41] about resource modeling
[63:43] and URL design
[63:45] also the status codes
[63:47] and the error handling
[63:49] as well as filtering, sorting and so on
[63:51] and we will learn the best practices
[63:53] when using and developing
[63:55] restful APIs
[63:57] let's start from the resource modeling
[63:59] resources are the core concepts
[64:01] in rest
[64:02] let's say you have the business domain
[64:04] which consists of the products, orders
[64:06] and reviews
[64:08] when modeling this to a restful API
[64:10] you usually convert this
[64:12] into nows and not verbs
[64:14] meaning that the product becomes
[64:16] products, order becomes orders
[64:18] and same for the reviews
[64:20] these can be collections
[64:22] or individual items
[64:24] for example this first request
[64:26] which is to/api/products
[64:28] will return you the collection
[64:30] of products not a single product
[64:32] but on the other hand you could have
[64:34] /products and/specific
[64:36] id of a product which will return
[64:38] you the individual item
[64:40] and notice that we are using
[64:42] the collectionof products
[64:44] and we are not using
[64:46] something like get products
[64:48] which will be not a best
[64:50] practice in restful APIs
[64:52] as I mentioned we are using
[64:54] nows here and not verbs
[64:56] so to fetch orders for example
[64:58] you don't define the URL
[65:00] as get orders
[65:02] you just define it as /orders
[65:04] and depending on the method
[65:06] that we'll use let's say it's a get method
[65:08] then you will retrieve the orders
[65:10] and so on
[65:12] so all the resources
[65:14] should be clearly identifiable
[65:16] through the URLs
[65:18] for instance this is an example
[65:20] of getting a collection
[65:22] this is an example
[65:24] of getting a specific item
[65:26] and also nested resources
[65:28] should be clear defined
[65:30] for example if you want to retrieve reviews
[65:32] for some specific product
[65:34] then we would assume that
[65:36] if you make a request to/products
[65:38] and then/reviews
[65:40] you would get the reviews
[65:42] for that specific product
[65:44] but in real world apis
[65:46] you rarely want to return all the results
[65:48] at once that's why we usually
[65:50] incorporate filtering sorting
[65:52] and pagination in apis
[65:54] so let's start from the filtering
[65:56] for example if you make a request
[65:58] to get all the products
[66:00] you usually add some query parameter
[66:02] which in this case you can see it's category
[66:04] so you're first of all filtering them by category
[66:06] and then also
[66:08] with the end sign
[66:10] you add that they should be in stock
[66:12] so the in stock should be true
[66:14] and this way you are only returning
[66:16] the items that you're going to display
[66:18] on the UI
[66:20] and you're not making some requests
[66:22] that will waste the bandwidth of this api
[66:24] and also it will be a huge
[66:26] response for you in the front-end side
[66:28] next you also have sorting
[66:30] in this case again it's controlled
[66:32] through the query parameters
[66:34] are anything that start
[66:36] after the question mark in the URL
[66:38] so in this case you usually
[66:40] pass the sort attribute
[66:42] and this can be for example
[66:44] ascending by price
[66:46] or ascending by reviews
[66:48] or it can be also the descending order
[66:50] so based on this you will
[66:52] get the response from the api
[66:54] in a sorted order
[66:56] because if you for example have
[66:58] thousand items in the back-end
[67:00] in the database
[67:02] retrieve all of these in
[67:04] unsorted order to the front-end
[67:06] because let's say the front-end now needs
[67:08] to sort them by the price ascending
[67:10] this means that it needs
[67:12] to make request to get all of the
[67:14] products which are this
[67:16] thousand items that you have in the database
[67:18] so that will be very inefficient
[67:20] that's why we do the sorting
[67:22] in the back-end instead
[67:24] so your back-end should support
[67:26] sorting functionality
[67:28] this way the front-end can just make
[67:30] this sort query parameter
[67:32] and then that way
[67:34] it will get the sorted
[67:36] products to be displayed on the screen
[67:38] and next we also have
[67:40] pagination again with the query parameter
[67:42] you usually pass the page
[67:44] which you want to retrieve
[67:46] and also the limit
[67:48] because if you don't pass the limit
[67:50] then again it will give you all of the
[67:52] products starting from the page 2 till
[67:54] the end which can be a lot of items
[67:56] so you also pass some sort of limit
[67:58] and that limit is whatever you're going
[68:00] to display on the front-end
[68:02] and then based on that you will get the response
[68:04] and here let's say you fetched
[68:06] 10 items so you're going to display
[68:08] those 10 on the UI
[68:10] and then once they click on the next page
[68:12] you will make another request to the page
[68:14] 3 this time and you will
[68:16] get the next items from the server
[68:18] now usually we use
[68:20] page for pagination but
[68:22] there is another common attribute that is
[68:24] offset so some apis use
[68:26] offset instead of the page
[68:28] and they use this in combination
[68:30] with limit which basically means
[68:32] if you have 1000 items
[68:34] so offset will tell the api
[68:36] from where to start counting
[68:38] this 1000 items and the limit
[68:40] is the same as you have it here
[68:42] so it's basically limiting the number
[68:44] of items that you are getting
[68:46] from this offset to retrieve
[68:48] to the front-end and the last
[68:50] option you can also have this cursor
[68:52] based so instead of page and limit
[68:54] you would pass a cursor
[68:56] which will be the hash of the page
[68:58] you want to retrieve
[69:00] so this approach of adding filtering
[69:02] sorting and pagination comes with
[69:04] benefits so first of all
[69:06] it saves the bandwidth of your server
[69:08] it also improves the performance
[69:10] both in the server side and on the front-end side
[69:12] and it also gives the front-end
[69:14] more flexibility because now
[69:16] you can fetch only the things that you need
[69:18] and not some unnecessary data
[69:20] from the database
[69:22] now let's come to the HTTP methods
[69:24] that REST APIs use
[69:26] because they rely on HTTP protocol
[69:28] and hence they are using
[69:30] the HTTP methods
[69:32] especially for CRUD operations
[69:34] so these are the most common
[69:36] types of CRUD operations
[69:38] you would see in REST APIs
[69:40] first of all we have the GET method
[69:42] which is used for reading data
[69:44] from the API
[69:46] so this is for retrieving resources
[69:48] as you saw like retrieving the products
[69:50] reviews and so on
[69:52] and the URL usually looks like this
[69:54] you make a GET request
[69:56] to the /API/version
[69:58] of the API/resource name
[70:00] and these type of requests
[70:02] are both safe and idemponent
[70:04] which basically means
[70:06] if you make a request to /products
[70:08] two or three times
[70:10] you expect to receive the
[70:12] exact same output every time
[70:14] unless some new products
[70:16] obviously have been added to the database
[70:18] next we have the POST method
[70:20] this is usually when you are creating a resource
[70:22] in your server
[70:24] the common example is again
[70:26] you would make the request to exact same endpoint
[70:28] as you have it for the GET
[70:30] to create a collection
[70:32] but in this case instead of GET
[70:34] you are using POST method
[70:36] and this tells the API that you need
[70:38] to create a resource in the products
[70:40] and not retrieve them
[70:42] these type of requests change the
[70:44] state of the server
[70:46] if you make a new item
[70:48] and also they are not idemponent
[70:50] which means that they are creating a resource
[70:52] so the first time you create a resource
[70:54] you will get the id
[70:56] of the first item that you created
[70:58] the second time you create it
[71:00] you will get the id of the second one
[71:02] and so on
[71:04] next we have the PUT and PUT methods
[71:06] which are very similar
[71:08] when they are updating resources
[71:10] in your API
[71:12] but they do it a bit differently
[71:14] if you create a resource
[71:16] whereas the PUT method
[71:18] partially updates the resource in your API
[71:20] now you can see that
[71:22] request URL is exactly the same
[71:24] in both of their cases
[71:26] so it's to /products/id
[71:28] of a product you want to modify
[71:30] just in case of the PUT request
[71:32] it will take this whole product
[71:34] with the id of 123
[71:36] and it will basically replace it
[71:38] with the new one that is coming from the frontend
[71:40] whereas in case of the PUT
[71:42] it will take this item from the database
[71:44] with id 123
[71:46] but it will update it partially
[71:48] let's say you just updated the title
[71:50] from the frontend
[71:52] and you made the request
[71:54] itpatch method
[71:56] so this will only update the title
[71:58] of this product
[72:00] and it will leave the other parts
[72:02] other properties unchanged
[72:04] and the last crowd operation is delete
[72:06] and we use delete method in this case
[72:08] and obviously as the name tells
[72:10] from the database
[72:12] so again the URL is exactly the same
[72:14] as you have for modifying items
[72:16] it's to /products/id
[72:18] of the resource
[72:20] and in this case you are not passing anything
[72:22] in the request body
[72:24] so you are just making a delete request
[72:26] to this item and you are removing this
[72:28] from the database
[72:30] and each of these operations
[72:32] return you different status codes
[72:34] depending on how the request went
[72:36] whether it was successful or not
[72:38] for that we have status codes
[72:40] and error handling in RESTful APIs
[72:42] so you should use the appropriate
[72:44] status codes when working with REST APIs
[72:46] for example the 200 series
[72:48] are for successful requests
[72:50] for example 200 is okay
[72:52] 201 is resource
[72:54] has been created
[72:56] 204 is there is no content here
[72:58] let's say you made a request
[73:00] the previous request we were talking about
[73:02] to /products/id
[73:04] of a product
[73:06] and you successfully retrieved this item
[73:08] this means that you also
[73:10] need to set the status code to
[73:12] 200 because the request
[73:14] has been successful
[73:16] in the other case where you are creating a product
[73:18] and you are making a post request to /products
[73:20] this time you shouldn't
[73:22] response with the same 200 code
[73:24] because 200 generally means
[73:26] that the status was okay
[73:28] but in 201 case
[73:30] it means that the resource has been created
[73:32] and in this case since you are creating a new
[73:34] product you should obviously response
[73:36] with 201 status code
[73:38] meaning resource has been created
[73:40] you also have 300 series
[73:42] which are for redirection
[73:44] let's say you make a request to a URL
[73:46] and now this URL has been moved
[73:48] to somewhere else
[73:50] so it will respond with 300 series
[73:52] and it will redirect you to the new URL
[73:54] in 400 series
[73:56] we have the client errors
[73:58] so this is whenever your frontend
[74:00] made a build request or the user
[74:02] is not authenticated
[74:04] to make this request
[74:06] for 400 we have not found
[74:08] so generally when you visit some URL
[74:10] or you make a request
[74:12] for some specific resource
[74:14] that doesn't exist
[74:16] you would get this 404 status code
[74:18] so for 400 case
[74:20] let's say you made a request
[74:22] with invalid parameters
[74:24] or some
[74:26] wrong json format
[74:28] in this case
[74:30] you would get a generic 400
[74:32] request
[74:34] but if a user makes a request
[74:36] to get some product
[74:38] which is let's say
[74:40] the product with this ID
[74:42] and it doesn't exist in the database
[74:44] after querying it
[74:46] then you should respond with
[74:48] 404 status code meaning that the resource
[74:50] has not been found
[74:52] and lastly we have 500 series
[74:54] these are things when error happens
[74:56] in your server so you don't know
[74:58] the exact reason
[75:00] and it's also not a client error
[75:02] meaning client requested everything
[75:04] properly
[75:06] and in this case we throw unexpected
[75:08] server side errors
[75:10] you generally respond with a server error
[75:12] message and you return the 500
[75:14] status code along with it
[75:16] when it comes to best practices
[75:18] of restful APIs
[75:20] first of all notice that we are using plural
[75:22] nouns for all of the resources
[75:24] so instead of /product
[75:26] for retrieving
[75:28] the products collection
[75:30] so you should always use the plural
[75:32] in this case
[75:34] also in the crowd operations
[75:36] we use the proper HTTP methods
[75:38] for example when making a request
[75:40] to delete users
[75:42] we expect to make a request
[75:44] to users /id of a user
[75:46] and not some post request
[75:48] to /users /id
[75:50] so first of all the HTTP methods
[75:52] needs to be properly set up
[75:54] we don't expect some random things
[75:56] like /delete
[75:58] to delete a resource from the database
[76:00] as you saw we also support filtering
[76:02] sorting and pagination
[76:04] in good rest apis
[76:06] not only pagination
[76:08] for example in this case
[76:10] we only have the page 3
[76:12] but we cannot limit the amount of
[76:14] products that we want to retrieve
[76:16] whereas in this case we can fully control
[76:18] what we want to get from the api
[76:20] we want to get the items from page 3
[76:22] we want this number of limits
[76:24] to be applied on the products
[76:26] and we also want to apply some sort
[76:28] like sorting to sort the price
[76:30] or sort by ratings and so on
[76:32] and also versionings
[76:34] in the restful apis
[76:36] as you noticed in all of these requests
[76:38] they all come with a prefix
[76:40] which is /api
[76:42] and then /id of the api
[76:44] which is either v1, v2, v3 and so on
[76:48] because let's say in the future
[76:50] you can integrate your api
[76:52] and you start using bunch of new features
[76:54] but you also break something
[76:56] in the previous version 1
[76:58] then if you use the versioning
[77:00] you won't break it on the frontend
[77:02] because they can use the old version
[77:04] of your api
[77:06] and still use the old features
[77:08] and functionalities
[77:10] while you continue to develop the new version
[77:12] let's say version 3
[77:14] and you support new features here
[77:16] and you might have broken something here
[77:18] but you won't break the end users
[77:20] so to recap
[77:22] we learned about the rest architectural principles
[77:24] and constraints
[77:26] also about the resource modeling
[77:28] and url design
[77:30] and how we model the business domain
[77:32] into the restful api domain
[77:34] also the status codes
[77:36] error handling
[77:38] and the proper methods
[77:40] to be used with the basic crowd operations
[77:42] and lastly we covered
[77:44] the best practices for restful apis
[77:46] to keep your apis consistent
[77:48] and also predictable
[77:50] for other developers who are using it
[77:52] traditional restful apis
[77:54] offer return too much
[77:56] or too little data
[77:58] which requires us to do multiple requests
[78:00] for a single view
[78:02] to get all the data that we need
[78:04] graphql solves this issue
[78:06] by giving clients exactly what they requested for
[78:08] but designinggraphql apis
[78:10] is different from designing restful apis
[78:12] that's why in this video
[78:14] we learned about the concept ofgraphql
[78:16] and why it exists
[78:18] the schema design
[78:20] and type system ofgraphql
[78:22] queries and mutations
[78:24] error handling
[78:26] and also best practices
[78:28] for designinggraphql apis
[78:30] let's start by understanding
[78:32] whygraphql exists in the first place
[78:34] it was created by facebook
[78:36] to solve a very specific pain
[78:38] which is clients needing to make multiple api calls
[78:40] and still not getting the exact data
[78:42] we have the facebook apis
[78:44] like user api,posts api
[78:46] comments and likes
[78:48] for the facebook page
[78:50] most of the times client can make requests
[78:52] to all of these apis separately
[78:54] and still not get all the data that it needs
[78:56] which will require it to do multiple requests
[78:58] to the same api
[79:00] this ofcourse adds up
[79:02] to the overall latency of the page
[79:04] because the page is still not loaded
[79:06] until all of these requests are made
[79:08] and the data is fetched
[79:10] but in case ofgraphql apis
[79:12] you have a singlegraphql endpoint
[79:14] so the client specifies
[79:16] the shape of the response
[79:18] and this one endpoint handles
[79:20] all of the data interactions
[79:22] it is still an http request
[79:24] but as you can see we can specify
[79:26] the exact data that we need
[79:28] for example we need the user with id 123
[79:30] and we need only the name of the user
[79:32] also posts and from the posts
[79:34] we can specify only title
[79:36] so we don't need images for this view
[79:38] and again with the comments you can specify
[79:40] the exact data that you need
[79:42] within the object so that you are not doing
[79:44] overfetching of the data
[79:46] now let's see the schema design
[79:48] and type system ofgraphql
[79:50] and how it's different from restful apis
[79:52] the schema in this case is a contract
[79:54] between the client and server
[79:56] in schema first of all you have types
[79:58] which can be for example user type
[80:00] that you specify
[80:02] and you specify all the fields
[80:04] that exist on this user type
[80:06] the name posts and so on
[80:08] and as you can see if the type
[80:10] is not a primitive type like posts
[80:12] then you can specify another type
[80:14] of post array and then this post
[80:16] type can be defined separately
[80:18] next we have queries to read
[80:20] data so this is the equivalent
[80:22] of doing get requests in
[80:24] restful api you specify
[80:26] the query and the function
[80:28] of this query this can be the user query
[80:30] which fetches the user with
[80:32] specific id and also
[80:34] return type of this query
[80:36] which in this case is the user type
[80:38] that we defined above
[80:40] andgraphql also come with mutations
[80:42] you can think of this as the equivalent
[80:44] to post,put,patch
[80:46] and delete methods in restful apis
[80:48] so anytime you are mutating
[80:50] data in the database
[80:52] you are making a mutation query
[80:54] here as you can see we have an example
[80:56] of create user method
[80:58] which accepts name and of course many things
[81:00] in real world and then it returns
[81:02] the user type that we have defined above
[81:04] so if you have good schema
[81:06] design ingraphql it should
[81:08] mirror your domain model
[81:10] and it should be intuitive and flexible
[81:12] next once you define
[81:14] the schema design and type system
[81:16] you can start querying and mutating
[81:18] data with thisgraphql api
[81:20] for that we have queries for fetching
[81:22] data again this is like the
[81:24] get requests in restful apis
[81:26] and here you can specify exactly
[81:28] what you need from the user
[81:30] the same user method that we defined
[81:32] therein the schema
[81:34] so here you can also specify
[81:36] exact attributes like the name
[81:38] posts and from posts you need the title
[81:40] only and this will make a request
[81:42] to yourgraphql api and return
[81:44] the exact data that you requested
[81:46] similarly you can also use
[81:48] the mutations that you defined
[81:50] for example if you have a create post
[81:52] method defined as a mutation
[81:54] you can use this to mutate the
[81:56] post for example setting the title
[81:58] the body of the post and then you also
[82:00] specifywhat data you need to retrieve
[82:02] after this post is created
[82:04] which is id and title
[82:06] when it comes to error handling in
[82:08] graphql apis this is a bit different
[82:10] than in restful apis since
[82:12] graphql always returns200
[82:14] ok status for all responses
[82:16] even if there was an error
[82:18] in this case we have to returnerrors
[82:20] field in the response which will
[82:22] indicate that there was an error
[82:24] so partial data can still be returned
[82:26] with errors like in this case
[82:28] we have the user which is null
[82:30] and then we have the errors field
[82:32] which indicates that you have the status code
[82:34] 404,message not found
[82:36] and path which is the user in your schema
[82:38] as you can see in this case
[82:40] you can specify the status code
[82:42] in the errors array
[82:44] since we are returning200 status codes
[82:46] for allgraphql requests
[82:48] that's why we have the status code
[82:50] specifically mentioned in the errors
[82:52] so that we know what kind of error
[82:54] we have found
[82:56] there are also best practices that we
[82:58] normally follow when designing
[83:00] graphql apis
[83:02] first of all the schemas that we saw
[83:04] it's a good practice to keep them
[83:06] small and modular
[83:08] also we should avoid deeply nested queries
[83:10] for example you can have a user
[83:12] and then nested post
[83:14] and then within the post you can
[83:16] have a comment so this can be infinitely
[83:18] nested and to avoid that we usually
[83:20] implement query limit depth
[83:22] if you have any query
[83:24] you can have it in your data
[83:26] so you specify something like
[83:28] 6 or 7 layers deep
[83:30] you also use meaningful naming
[83:32] for types and fields
[83:34] so that it also makes from the client side
[83:36] because they both are going to use the same schema
[83:38] and when mutating data
[83:40] we always use the input types for mutations
[83:42] before a system can
[83:44] authorize or restrict anything
[83:46] it first needs to know the identity
[83:48] of the requester
[83:50] the user accessing our service
[83:52] through a browser
[83:54] or through mobile app
[83:56] or it's a third party service
[83:58] trying to access our system
[84:00] that's what authentication does
[84:02] it verifies that the user
[84:04] or service trying to access our system
[84:06] is who they claim to be
[84:08] but here is where most software engineers
[84:10] confuse or mix up concepts
[84:12] they mix up authentication methods
[84:14] with authorization frameworks
[84:16] they treat JWT
[84:18] an authentication method
[84:20] when in reality it's just a token format
[84:22] they also confuse the bearer authentication
[84:24] with JWT
[84:26] they sometimes call
[84:28] OF2 an authentication method
[84:30] when in reality it's actually
[84:32] an authorization framework
[84:34] and they mix up single sign-on
[84:36] with authentication methods
[84:38] when it's really a user experience pattern
[84:40] in this video we're going to fix
[84:42] all of that by covering
[84:44] first of all what authentication is
[84:46] and then all the major types
[84:48] of authentication starting from
[84:50] basic to digest authentication
[84:52] to API keys,sessions
[84:54] and cookies,bearer authentication
[84:56] and JWT tokens
[84:58] voter access and refresh tokens
[85:00] also we'll cover
[85:02] OF2,open ID connect
[85:04] also single sign-on and identity
[85:06] protocols and understand
[85:08] what each one actually is
[85:10] and where this all fits
[85:12] let's first understand what is authentication
[85:14] and then we'll get into the different
[85:16] authentication methods
[85:18] authentication really answers
[85:20] one simple question
[85:22] which is who the user is
[85:24] whoever is trying to access our system
[85:26] let's say you have your system
[85:28] like your API gateway
[85:30] the layer of APIs
[85:32] then your service layer
[85:34] and also the data storage
[85:36] before anyone can make requests
[85:38] to your API gateway
[85:40] and start accessing services
[85:42] that is where they send
[85:44] a login request
[85:46] this comes either from a user
[85:48] or another service
[85:50] this is where we confirm their identity
[85:52] if it's valid and grant access
[85:54] to our system,to our API gateway
[85:56] and all the other services
[85:58] or if the identity is not
[86:00] confirmed then we reject it
[86:02] with a 401 onauthorized response
[86:04] this is the first step
[86:06] before they will get into the
[86:08] authorization which is
[86:10] they can access and what they can do
[86:12] once they can sign in
[86:14] to your system
[86:16] but that's a separate discussion in itself
[86:18] so in this one we're primarily focusing
[86:20] on the authentication
[86:22] and different authentication methods
[86:24] that we can use to verify
[86:26] the user's identity
[86:28] now let's see the different authentication methods
[86:30] that we have to verify
[86:32] the identity of the requester
[86:34] and let's start with the basic authentication methods
[86:36] these are the basic
[86:38] off,digest authentication
[86:40] API keys and session-based authentication
[86:42] let's start with
[86:44] the very first one on the list
[86:46] which is the basic authentication flow
[86:48] this is the simplest form
[86:50] of authenticationlet's say
[86:52] you're making a request to the server
[86:54] to access some resource like
[86:56] API/users to retrieve the user data
[86:58] you will first receive
[87:00] an unauthorized response
[87:02] because you didn't provide the credentials
[87:04] so we prompt the user
[87:06] or the service to provide credentials
[87:08] before accessing any resource
[87:10] in the server
[87:12] so in the upcoming request
[87:14] to the same resource they also provide
[87:16] the authorization header
[87:18] and this header contains the base
[87:20] 64 encoded version
[87:22] of the username and password
[87:24] for this user
[87:26] this is where we verify it on the server
[87:28] site if the credentials are valid
[87:30] then we respond with
[87:32] 200 ok status with the
[87:34] data returned in the body
[87:36] or we unauthorize it again
[87:38] marking this as credentials
[87:40] invalid
[87:42] the problem with this method is that
[87:44] base64 is easily reversible
[87:46] so this is an insecure method
[87:48] unless it is wrapped with
[87:50] https protocol
[87:52] and even then it's rarely
[87:54] used nowadays in production
[87:56] outside of the internal tools
[87:58] because you're sending the credentials
[88:00] with every request
[88:02] you're sending the base64 encoded
[88:04] versionwhich is not that secure
[88:06] that's why we also have
[88:08] a digest authentication
[88:10] which is slightly better
[88:12] and it uses the md5 hashing
[88:14] so this method works similar
[88:16] to the authentication
[88:18] with basic version
[88:20] so you are let's say trying to access
[88:22] the same resource like the users
[88:24] it will first respond with
[88:26] 401unauthorized prompting you
[88:28] to include the credentials
[88:30] and then you'll make the same request
[88:32] but with the hashed response
[88:34] and that will also contain
[88:36] the md5 hash version
[88:38] instead of the plain
[88:40] password and username
[88:42] and same process as the
[88:44] previous one if the credentials
[88:46] are invalid you will receive 401unauthorized
[88:48] otherwise you will receive
[88:50] the successful response with the user
[88:52] data in the request body
[88:54] this is slightly better than
[88:56] the basic off as it uses
[88:58] the md5 hashing
[89:00] but it's still outdated and rarely used
[89:02] today because we have better options
[89:04] as you will see soon
[89:06] and if you're wondering how do we set
[89:08] these options in the authorization
[89:10] for instance if you're making the request
[89:12] from postman or if you're doing this
[89:14] from the code then you'll include it as the
[89:16] header in the request
[89:18] this is where you can set the authentication type
[89:20] and you will notice the things
[89:22] that we're discussing here like the
[89:24] basic authentication which was the first version
[89:26] or digest authentication
[89:28] which is the second version
[89:30] and you will see the other methods available
[89:32] here also the api key
[89:34] optionand postman calls
[89:36] all of these authentication types
[89:38] to just keep it simple
[89:40] on the interface but that's also one
[89:42] of the reasons why developers get confused
[89:44] and they think that all of these
[89:46] are authentication types when
[89:48] some of them are authentication methods
[89:50] some of them are authorization
[89:52] frameworks next we have api
[89:54] key authentication this is where
[89:56] you generate a unique key
[89:58] for each client and then
[90:00] they send it with each request
[90:02] to access the resources
[90:04] so for the same request as we
[90:06] discussed it comes to your
[90:08] api server first and
[90:10] it will include either authorization
[90:12] header or xapi
[90:14] key and that will include
[90:16] the api key that you generate
[90:18] it for the user these api
[90:20] keys are typically stored in a database
[90:22] with keyhush
[90:24] and also the scopes for the
[90:26] api key and for instance
[90:28] if you ever tried to access
[90:30] apis by generating a key
[90:32] on the dashboard and then
[90:34] it gives you the keyback which you
[90:36] can attach to the requests
[90:38] that is where you already used
[90:40] the api key of that service
[90:42] to access the data so if you
[90:44] included that key in the request
[90:46] then the server will first
[90:48] do an api key lookup in
[90:50] the permissions or users table
[90:52] and if it's able to verify
[90:54] that the api key is valid
[90:56] then we will authorize the request
[90:58] and send a successful response
[91:00] with the data in the response body
[91:02] otherwise the user will get
[91:04] a 401 unauthorized response
[91:06] and if the key is
[91:08] missing overall like the
[91:10] authorization header or xapi key
[91:12] then we just return
[91:14] a 400 bad request because
[91:16] the api key is required to
[91:18] access this type of system
[91:20] one issue with api keys is that
[91:22] if the key ever leaks
[91:24] then anyone can use it
[91:26] and start accessing the resources
[91:28] on your behelf with your api key
[91:30] and there is no built-in
[91:32] expiration unless you
[91:34] implemented yourself
[91:36] another thing is that this might seem
[91:38] similar to json web tokens
[91:40] but api keys are just
[91:42] random strings with no embedded
[91:44] information while in JWTV
[91:46] can store also information
[91:48] as you will see shortly
[91:50] so the server here has no way
[91:52] to know who owns the key
[91:54] or what permissions they have
[91:56] without looking it up in the database
[91:58] next we have the traditional
[92:00] web approach which is the
[92:02] session-based authentication
[92:04] this is where a user logs in
[92:06] with their credentials
[92:08] and then we create a session
[92:10] in some sort of session storage
[92:12] this session storage can be as simple
[92:14] in memory like just a variable
[92:16] but the problem here is that
[92:18] we will lose it once the server
[92:20] restarts or crashes
[92:22] the other option is we can use tools
[92:24] like redis which is one of the most
[92:26] common ones in production because
[92:28] it's fast and it supports
[92:30] expiration for the sessions
[92:32] or we can use a dedicated
[92:34] database here like sql type
[92:36] of database another option
[92:38] which is very rare is to use
[92:40] the file system of the
[92:42] server that you're using
[92:44] the problem with this one is that it's not scalable
[92:46] and overall redis is usually
[92:48] the go-to for production
[92:50] because it's fast and has built-in
[92:52] key expiration so with the
[92:54] first request we are fetching
[92:56] the session id and then we set
[92:58] the session cookie on the client
[93:00] side then for any other
[93:02] upcoming requests that contain
[93:04] this cookie we look up the session
[93:06] in the session storage here
[93:08] and then if the session is valid
[93:10] we will get back the user data
[93:12] and we will send it with
[93:14] authorized response otherwise
[93:16] if it's not found if we can't find
[93:18] the session then this user is not authenticated
[93:20] so we send them an unauthorized
[93:22] response one challenge with
[93:24] session-based authentications is that
[93:26] it is stateful which means that
[93:28] theserver must remember the sessions
[93:30] we need to have some sort of session
[93:32] storage here and it works great
[93:34] for traditional web apps
[93:36] but cannot scale as easily
[93:38] we need to be able to
[93:40] publish our API or
[93:42] distributed systems now
[93:44] let's look at token-based
[93:46] authentication we will cover
[93:48] batterer authentication jwt
[93:50] tokens access and refresh
[93:52] tokens and how this compares
[93:54] to the session-based
[93:56] authentication instead of
[93:58] sessions modern applications
[94:00] usually use tokens so
[94:02] the client sends a token
[94:04] with each request for example
[94:06] serverization header which
[94:08] will include the type of authentication
[94:10] which is bearer and also the token
[94:12] which will validate on the
[94:14] server site one thing developers
[94:16] confuse here is the bearer token
[94:18] and json web tokens
[94:20] bearer token just means whoever
[94:22] has this token gets access
[94:24] so it's a pattern but not a
[94:26] specific method and the most
[94:28] common type of bearer token is
[94:30] jwt json web token
[94:32] it's basically a signed
[94:34] json object that contains
[94:36] the user id or
[94:38] email for us to validate
[94:40] the user also expiration
[94:42] time and other claims
[94:44] as we need to store them like roles
[94:46] permissions and so on so
[94:48] what we do on the authentication server
[94:50] is we validate the credentials
[94:52] once we receive that
[94:54] authorization header and it is
[94:56] stateless meaning that we don't need
[94:58] a database here to look up and
[95:00] that is why it's also scalable
[95:02] compared to the session based authentication
[95:04] before the jwt
[95:06] let's say revolution
[95:08] a token was just a string
[95:10] with no information and
[95:12] that token was sent and then
[95:14] this was looked up in some sort
[95:16] of database and only then
[95:18] we could verify that the user
[95:20] has access the downside of that
[95:22] was that of course it's still stateful
[95:24] because we need the database
[95:26] access or cache which
[95:28] is required every time the token
[95:30] is used with json web
[95:32] tocans now we can encode and
[95:34] verify by assigning their
[95:36] own claims and this is what
[95:38] now allows us to issue a short
[95:40] liftjwt tokens
[95:42] that are stateless meaning
[95:44] they are self-contained and they
[95:46] don't depend on anybody else
[95:48] they do not need to hit the
[95:50] database and this reduces
[95:52] the databases load and
[95:54] it also simplifies the
[95:56] authentication process for the server
[95:58] so the first time we will receive
[96:00] the credentials and validate the user
[96:02] and if it is valid we will
[96:04] generate the json web token
[96:06] and send it to the client
[96:08] from this point forward
[96:10] the client can make requests
[96:12] and include this bearer token
[96:14] which is this authorization header
[96:16] that contains the bearer
[96:18] authentication with the token
[96:20] and that token is most cases
[96:22] it is a json web token
[96:24] we verify that signature locally
[96:26] without needing to hit the database
[96:28] and if the token is valid
[96:30] we return the requested data
[96:32] otherwise we return
[96:34] an unauthorized response
[96:36] modern systems also use
[96:38] two types of tokens
[96:40] one of them is the access token
[96:42] and the other one is the
[96:44] refresh tokens
[96:46] the reason we need two tokens here
[96:48] is that access tokens are shortlift
[96:50] and they are used for api calls
[96:52] to the server
[96:54] to the longlift
[96:56] and they are used to get new access tokens
[96:58] basically to renew
[97:00] the access token
[97:02] whenever user sends a login request
[97:04] and signs in
[97:06] they get both of these tokens
[97:08] we generate an access token
[97:10] that's valid for 15 minutes to 1 hour
[97:12] and we generate a refresh token
[97:14] that can last for days or even weeks
[97:16] client now will use the access token
[97:18] to access the api
[97:20] and make the requests
[97:22] and it also stores
[97:24] the refresh tokens
[97:26] one important note here is that
[97:28] we never store it in local storage
[97:30] but we store it in
[97:32] http-only cookies
[97:34] this prevents us from
[97:36] access attacks on the client side
[97:38] and after this user will
[97:40] stay logged in without re-entering credentials
[97:42] if their access token expires
[97:44] they will get an unauthorized response
[97:46] and this is where
[97:48] we will use that refresh token
[97:50] which we stored
[97:52] to generate a new access token
[97:54] on the off server site
[97:56] we can make a request with that new token
[97:58] and this will successfully return us
[98:00] the data since we renewed
[98:02] the access token
[98:04] next let's get into OAuth 2
[98:06] and OpenID Connect
[98:08] which are some of the
[98:10] misunderstood concepts
[98:12] and let's clarify whether these are
[98:14] authentication methods or authorization
[98:16] frameworks and how they work
[98:18] auth 2 is one of the concepts
[98:20] that is often misunderstood
[98:22] it's an authorization framework
[98:24] and not an authentication
[98:26] so it asksverse what can this
[98:28] up access on behalf of the user
[98:30] for instance
[98:32] if you want to grant an application
[98:34] access to your google drive
[98:36] to be able to read your files from there
[98:38] you would typically connect
[98:40] your google drive
[98:42] for this external application
[98:44] and you're giving the app permission
[98:46] to access your data
[98:48] the way it works is it first will
[98:50] redirect you to consent screen
[98:52] from the google
[98:54] authentication and it will
[98:56] show you the permission request
[98:58] and if you allow access
[99:00] for this application to
[99:02] be able to read the drive files
[99:04] on your behalf
[99:06] then it will return the authorization code
[99:08] to this external application
[99:10] or it can also be your application
[99:12] and the way it works after that
[99:14] is that you exchange the code
[99:16] for token
[99:18] and you return the access token
[99:20] from googleauth
[99:22] to be able to read the data
[99:24] that is the confusing part
[99:26] because you're getting back an access token
[99:28] for the google drive api
[99:30] and you might think that this is an
[99:32] authentication method
[99:34] but the access token just proves that
[99:36] the app can access your resources
[99:38] but it doesn't tell
[99:40] the app who you are
[99:42] the app is allowed to access
[99:44] certain resources from your google drive
[99:46] so after this point
[99:48] the application will be able to request
[99:50] fileswith that token
[99:52] and return the user files
[99:54] from google drive api
[99:56] next we have OpenID Connect
[99:58] which adds authentication
[100:00] on top of OAuth2
[100:02] so when you click on sign in to google
[100:04] let's say via your app
[100:06] it will redirect you to the
[100:08] authorization endpoint
[100:10] and this will show you the login screen
[100:12] where you grant access to
[100:14] sign in to google through your
[100:16] application
[100:18] if you enter your credentials and consent
[100:20] then the provider will return
[100:22] the authorization code
[100:24] and after this step your application
[100:26] will exchange the code for tokens
[100:28] and return the access token
[100:30] in combination with the
[100:32] ID token
[100:34] from here the access token is
[100:36] for OAuth2 authorization
[100:38] ID token is a json web
[100:40] token that contains your identity
[100:42] which includes your email
[100:44] or username user ID
[100:46] which means that after this point
[100:48] your application is able to
[100:50] verify the signature
[100:52] and extract the user's identity
[100:54] to send the id token
[100:56] for verification to your backend
[100:58] and by having this id token
[101:00] your application can now
[101:02] create its own session
[101:04] and grant the access token
[101:06] for that user
[101:08] this is a modern solution
[101:10] it's secure and also scales well
[101:12] and that's also why most
[101:14] applications nowadays use that type
[101:16] of authentication like sign in
[101:18] with google,github,microsoft and so on
[101:20] and lastly let's cover
[101:22] single sign on and identity
[101:24] protocols
[101:26] single sign on is a user experience
[101:28] not an authentication method
[101:30] which means that you're able to login once
[101:32] but access multiple
[101:34] services
[101:36] for example when you want to login
[101:38] to google or octa
[101:40] let's say you want to get access
[101:42] to your gmail to your google drive
[101:44] to youtube to google calendar
[101:46] you can do this by logging in once
[101:48] to the identity provider
[101:50] let's say it can be google
[101:52] in this case if you want to access
[101:54] these services
[101:56] and single sign on
[101:58] uses identity protocols underneath
[102:00] to validate these sessions
[102:02] so once you sign in with
[102:04] identity provider let's say it's google
[102:06] in this case your global session
[102:08] is stored in a session
[102:10] storage and then you get back
[102:12] single sign on cookie to your
[102:14] client to be able to access
[102:16] other resources so let's say you
[102:18] want to access gmail for the
[102:20] first time then once you login
[102:22] you verify also the session
[102:24] and now you're able to access
[102:26] gmail and for the next
[102:28] requests if you need to access
[102:30] google drive for the next one
[102:32] you don't need to login again
[102:34] because you have this cookie and the
[102:36] session stored in the session storage
[102:38] so we just verify your session
[102:40] and if it's valid then you get
[102:42] access to google drive as well
[102:44] and similarly to youtube to google
[102:46] calendar and other services
[102:48] as i mentioned single sign on
[102:50] uses identity protocols underneath
[102:52] and these protocols are
[102:54] samal which is security
[102:56] assertion markup language
[102:58] open id connect
[103:00] both of these are identity protocols
[103:02] which are used in combination
[103:04] with single sign on
[103:06] in case of samal to be able
[103:08] to access the app you redirect
[103:10] it to login and this is where we
[103:12] use samal for authentication
[103:14] this is a common solution
[103:16] in enterprise and legacy systems
[103:18] like salesforce,corporate
[103:20] dashboards and so on
[103:22] it is an xml based protocol
[103:24] so once you want to
[103:26] sign in you are redirected to login
[103:28] and then you get back
[103:30] the samal assertion in xml
[103:32] format and after that
[103:34] your identity is confirmed
[103:36] for the user and now you're able
[103:38] to access the third
[103:40] party application
[103:42] samal is still widely used
[103:44] but it's an older version compared
[103:46] to open id connect so the next
[103:48] option is the open id connect
[103:50] as an identity protocol
[103:52] let's say you want to access an app
[103:54] in this case it's gmail
[103:56] you will be redirected to login
[103:58] to provide your credentials
[104:00] and once you provide your credentials
[104:02] the user is authenticated
[104:04] and now you get back
[104:06] the id token in jason
[104:08] web token format
[104:10] and this is what you will use
[104:12] for confirming your identity
[104:14] with gmail this is for instance
[104:16] what google uses under the hood
[104:18] and it's a more modern approach
[104:20] comparedto samal but both
[104:22] them are still very secure
[104:24] and relevant
[104:26] these are the most common types of authentication
[104:28] and that is just the first
[104:30] step for accessing our system
[104:32] after you know who the user is
[104:34] with authentication
[104:36] you need to also know what they can do
[104:38] and what permissions they have
[104:40] the authentication is just the first step
[104:42] before users can access your service
[104:44] so this tells you who the user is
[104:46] and if they are allowed
[104:48] to access your service
[104:50] they send a login request
[104:52] and you confirm or deny their identity
[104:54] but after that
[104:56] you also have the authorization step
[104:58] which tells you what resources
[105:00] exactly this user can access to
[105:02] basically it tells you what they can do
[105:04] what the user can do in your system
[105:06] and that is what we will cover next
[105:08] in the next video
[105:10] authorization is the step
[105:12] that happens after authentication
[105:14] once someone is logging in into our system
[105:16] so once the login request
[105:18] is approved
[105:20] which means that the system now knows
[105:22] who the user is
[105:24] the next step is deciding what they can do
[105:26] which is the step of authorization
[105:28] it needs to check what resources or actions
[105:30] that user has permissions to access
[105:32] and also what are the denied actions
[105:34] for this user
[105:36] this is how we control security
[105:38] and privacy in the systems
[105:40] and in this video you learn how applications
[105:42] and systems manage permissions
[105:44] using the free main authorization models
[105:46] if someone is role-based access control
[105:48] next we have attribute-based
[105:50] access control
[105:52] also access control list
[105:54] which is another way of managing authorization
[105:56] plus you learn how technologies
[105:58] like OAuth2 and GVTs
[106:00] help us to enforce those rules in practice
[106:02] so authentication happens first
[106:04] which tells us who the user is
[106:06] and if they are allowed to access our system
[106:08] but on the next step
[106:10] we have authorization
[106:12] which determines what you can actually do
[106:14] in this system
[106:16] if we take a look at github as an example
[106:18] and accessing repositories on github
[106:20] there you have different permissions
[106:22] for different users
[106:24] for example user A can have right access only
[106:26] which means they can only push code
[106:28] to this repo
[106:30] but on the other hand we can have user B
[106:32] and here you can grant only read access
[106:34] which means they can only read this repository
[106:36] but they cannot push code to it
[106:38] or they cannot create pull requests
[106:40] and so on
[106:42] on the other side we can have also admin users
[106:44] which have full control
[106:46] so they can manage all the settings
[106:48] for the repository
[106:50] they can even decide to delete this repository
[106:52] and so on
[106:54] so you can see that different users can have
[106:56] different access controls on systems
[106:58] to manage these access controls
[107:00] we have common authorization models
[107:02] so the one that we just looked at
[107:04] is the role-based authentication model
[107:06] which assigns roles to users
[107:08] something like admin,editor
[107:10] read-only access,write-only access
[107:12] and this is the most common
[107:14] approach among these authorization models
[107:16] but we also have
[107:18] attribute-based access control
[107:20] which is based on the user
[107:22] or resource attributes
[107:24] so this is more flexible and more complex
[107:26] compared to the role-based authentication
[107:28] and the other common approach
[107:30] is to have access control lists
[107:32] acl
[107:34] and each resource here has its own permissions list
[107:36] so you can assign permission lists
[107:38] to a resource
[107:40] and this is what will determine
[107:42] what resources you can access
[107:44] for example this is a common way of managing
[107:46] google docs and we will look at this
[107:48] in more detail now
[107:50] and each of these models has its trade-offs
[107:52] pros and cons
[107:54] so this depends on the specific system
[107:56] requirements but real systems often
[107:58] combine also multiple models
[108:00] together to have more complex
[108:02] and more secure setup
[108:04] so first up we have role-based
[108:06] access control or RBAC
[108:08] as an acronym here users
[108:10] are assigned to roles
[108:12] and each role has a defined set of permissions
[108:14] for example as you saw
[108:16] with the github you can have admins
[108:18] and admins usually have full access
[108:20] to all resources
[108:22] so they can create, they can read or update
[108:24] resources, they can even delete
[108:26] resources and also manage other users
[108:28] in the roles
[108:30] and next you have editor
[108:32] which is usually a bit less than admin
[108:34] so they can edit content
[108:36] like creating or reading content
[108:38] or updating resources
[108:40] but they cannot delete resources
[108:42] and they cannot also manage other users
[108:44] and next you can have viewer users
[108:46] which can only read data
[108:48] so they can read the resources
[108:50] and content
[108:52] but they cannot update anything
[108:54] or they cannot create anything in your system
[108:56] this is the most common way
[108:58] in authorization models
[109:00] and this is used in apps that you use daily
[109:02] like you saw with github
[109:04] or stride dashboards
[109:06] or CMS tools, team management tools
[109:08] and so on
[109:10] the next model is attribute based
[109:12] access control or ABAC
[109:14] in short this access control
[109:16] goes beyond the roles
[109:18] so it uses the user attributes
[109:20] or resource attributes
[109:22] and environment conditions
[109:24] to define the access
[109:26] some example policy you can see here
[109:28] let's say you want to only allow access
[109:30] or resources are met
[109:32] in this case whenever the user department
[109:34] is set to HR
[109:36] and you can combine this with multiple conditions
[109:38] like whenever the resource
[109:40] attribute equals to internal
[109:42] and so onand only in this case
[109:44] you allow them access
[109:46] and you either allow them read access
[109:48] or write access so this can also be combined
[109:50] with role based authorization
[109:52] but in this case you are checking the user model
[109:54] or resource model
[109:56] in your database
[109:58] on the attributes you either allow
[110:00] or deny the access
[110:02] so here as you can see we are checking
[110:04] user attributes like the department
[110:06] the ageor whatever you want to check here
[110:08] next you can also
[110:10] combine it with resource attributes
[110:12] like confidentiality
[110:14] or the owner of the resource
[110:16] or classification
[110:18] and this can also be combined with environment
[110:20] like time of the day
[110:22] location, device type and so on
[110:24] since you are combining these attributes
[110:26] to either ground or restrict
[110:28] access this is more flexible
[110:30] than the role based authorization
[110:32] but it requires good policy management
[110:34] and generally it's more complex
[110:36] and you can encounter conflicts
[110:38] here with the attribute based
[110:40] access control
[110:42] the third common type is the access control
[110:44] lists instead of providing role
[110:46] based access or attribute
[110:48] based access you can have access control
[110:50] list for the specific resource
[110:52] let's say you have a resource like a document
[110:54] or a json file
[110:56] and here you can have a permission
[110:58] list on which users can access
[111:00] this document
[111:02] like user alice has only read access
[111:04] or user bob has both
[111:06] read and write access
[111:08] and another user has no access
[111:10] to this document so as you can see
[111:12] we are managing two things here
[111:14] first of all which users are allowed
[111:16] to access this document
[111:18] and second what are their permissions
[111:20] so each of the users has different
[111:22] permissions on this document
[111:24] acls are highly specific
[111:26] and also user centric
[111:28] which means it's hard to scale them well
[111:30] in systems with millions
[111:32] of users or objects
[111:34] unless you manage them carefully
[111:36] but for example google drive
[111:38] is one example of this
[111:40] where you have documents like a google doc
[111:42] and then you share this google doc
[111:44] with your colleagues
[111:46] so you share someone with read access
[111:48] only and then you share this doc
[111:50] with someone else but now they can
[111:52] also edit and add comments
[111:54] to this document
[111:56] so this is an example of
[111:58] acl access control list
[112:00] which is used in google drive
[112:02] and google documents
[112:04] this gives you more control over
[112:06] resources and documents but it's also
[112:08] harder to scale with millions of users
[112:10] but it's possible as you can see
[112:12] because google drive is using this
[112:14] for their documents excel sheets
[112:16] and so on
[112:18] acl access control models
[112:20] but how do systems enforce those
[112:22] authorizations
[112:24] this are where oaf2 and gbt
[112:26] oracl access tokens come into play
[112:28] so first we have oaf2
[112:30] which is delegated authorization
[112:32] which is a protocol used
[112:34] when service wants to access
[112:36] another services resources
[112:38] on a behalf of a user
[112:40] for example if you want to let
[112:42] a third party up read your
[112:44] github repositories
[112:46] you are up to vercell
[112:48] so you need to give vercell control over
[112:50] your repository on github
[112:52] instead of giving your username
[112:54] and password to the third party
[112:56] application which won't be
[112:58] secure at all because you don't know
[113:00] what they can do with your username
[113:02] and password this way you are giving them full control
[113:04] instead github gives them the
[113:06] token that represents the permissions
[113:08] which you approved to use
[113:10] so you as a user send a request
[113:12] with the third party
[113:14] app to request access
[113:16] to your repositories
[113:18] and then github gives you the
[113:20] access token which you should create
[113:22] so you should also provide
[113:24] world resources what repositories
[113:26] this third partyapp can access
[113:28] and also what they can do
[113:30] can they create read update
[113:32] or can they delete or whatever
[113:34] the permissions you set
[113:36] and then github sends them the token
[113:38] which contains the permissions
[113:40] which this third partyapp is allowed to use
[113:42] and it defines the flow for securely issuing
[113:44] and validating those tokens
[113:46] so you give them the access token
[113:48] and not your password
[113:50] which represents the permissions
[113:52] that you approved personally
[113:54] so it can be reading specific repos
[113:56] or also creating pushing
[113:58] to those repositories
[114:00] but not deleting those repositories
[114:02] and next we have also token based
[114:04] authorization using gbt
[114:06] or bearer tokens and permission logic
[114:08] once a user is authenticated
[114:10] most systems use a token
[114:12] typically a gbt token
[114:14] or this can be also bearer token
[114:16] that carries this information
[114:18] like user ID
[114:20] the roles like admin or editor
[114:22] and also scopes which is
[114:24] what scopes they are allowed to access
[114:26] and whenever this token is
[114:28] expiring and who is the issuer
[114:30] of this token
[114:32] so whenever a user makes a request
[114:34] it always carries this token information
[114:36] and reaches to the backend server
[114:38] this is where the server
[114:40] will check your token and validity
[114:42] and it will apply
[114:44] the appropriate permission logic
[114:46] so to not confuse this with
[114:48] authorization models there is a key distinction
[114:50] the token usually carries the identity
[114:52] and claims of your user
[114:54] as you see it here
[114:56] butauthorization models like role based
[114:58] or attribute based
[115:00] this is what defines what is allowed
[115:02] to access as a user
[115:04] so tokens are just mechanisms
[115:06] but these areauthorization models
[115:08] so in summary
[115:10] authorization isn't just letting users in
[115:12] like authentication
[115:14] but it also controls what they can access
[115:16] once they are in
[115:18] we learned what authorization is
[115:20] what are the three most common
[115:22] authorization models which are role based
[115:24] attribute based and access control lists
[115:26] and also you saw couple of real world examples
[115:28] like how github manages
[115:30] yourauthorization tokens
[115:32] and this should give you an idea
[115:34] you can choose each model based on the system
[115:36] that you're building
[115:38] and you also saw some implementation patterns
[115:40] with oof2 or gbt tokens
[115:42] each of these models has
[115:44] their own tradeoffs,their own pros and cons
[115:46] and real systems often combine
[115:48] multiple models to stay flexible
[115:50] and secure
[115:52] APIs are like doors into your system
[115:54] if you leave them unprotected
[115:56] then attackers and anyone can
[115:58] walk right in and do whatever
[116:00] they want with your user data
[116:02] that's why in today's video we'll look
[116:04] at 7 proven techniques
[116:06] which will help you to protect your
[116:08] APIs from unwanted attacks
[116:10] the first one we have in the list
[116:12] is rate limiting which controls
[116:14] how many requests a client
[116:16] can make in a given time
[116:18] for example you can set a limit
[116:20] for user A to make
[116:22] let's say 100 requests per
[116:24] some period of time to your API
[116:26] and if they cross that limit
[116:28] and let's say make 101 requests
[116:30] then you block the next request
[116:32] and allow some time
[116:34] to pass before they can send
[116:36] their next request
[116:38] if you don't set this to your API
[116:40] then attackers can overwhelm your system
[116:42] they can send like thousands
[116:44] of requests per minute
[116:46] and then overwhelm your API
[116:48] which will take your system down
[116:50] or it can also brute force your data
[116:52] and this rate limits can be set
[116:54] per endpoint
[116:56] for instance let's say you have some
[116:58] request to either create a comment
[117:00] or fetch comments
[117:02] you can set that limit for endpoint level
[117:04] so these comments endpoint
[117:06] will be set to some
[117:08] strict number of requests per minute
[117:10] you can also set it per
[117:12] user or IP address
[117:14] let's say in A we have the IP
[117:16] address of first user and then B
[117:18] for the second C for this one
[117:20] and your attacker has some IP
[117:22] address which corresponds to D
[117:24] if you get the 101
[117:26] request from the DIP
[117:28] address then you will know
[117:30] that this user overused the
[117:32] API so you will block it
[117:34] at the user IP level
[117:36] and there is also overall rate
[117:38] limiting to protect from DDoS
[117:40] attacks since you can set the rate
[117:42] limit to work per user
[117:44] or per IP address that means
[117:46] that this attacker alone cannot send
[117:48] that many requests you will block
[117:50] it with your rate limiting in the
[117:52] API but what they can do
[117:54] they can spin up some bots and each
[117:56] bot will have their own limit
[117:58] let's say you've set it to 100
[118:00] per IP address so each
[118:02] of these bots has 100
[118:04] and overall they have more than
[118:06] you would allow or your system
[118:08] could handle that's why you have
[118:10] also overall rate limiting
[118:12] which can be some bigger number
[118:14] whenever all the traffic coming
[118:16] into your server reaches
[118:18] or passes this number then you
[118:20] will temporarily block all requests
[118:22] until you find out the root cause
[118:24] and ofcourse these numbers are just
[118:26] examples so in reality
[118:28] it's much more than 1000
[118:30] but that's just an example
[118:32] the second one on the list is course
[118:34] which stands for cross origin resource sharing
[118:36] this controls which domain
[118:38] can call your API from a browser
[118:40] and without proper course
[118:42] malicious websites could trick
[118:44] users browsers into making requests
[118:46] on their behalf
[118:48] for instance if your API is
[118:50] only meant to serve your front
[118:52] and upwhich is at
[118:54] up.yourdomain.com
[118:56] then only requests from this
[118:58] source should be allowed
[119:00] if anyone else sends your request
[119:02] like up another domain.com
[119:04] then you should block this request
[119:06] and not allow them to use your API
[119:08] for authenticating or
[119:10] using any of its data
[119:12] the third one is also a common one
[119:14] which is SQL and noSQL injections
[119:16] injection attacks can happen
[119:18] when the user input is directly included
[119:20] in the database query
[119:22] for instance attacker can modify
[119:24] it and send some queries
[119:26] to read or delete your data
[119:28] here for example this part
[119:30] bypasses the checks entirely
[119:32] and then attacker can use
[119:34] this query to start reading data
[119:36] from your database or modify
[119:38] anything or they can also delete
[119:40] all the data,all the user data
[119:42] and any other tables
[119:44] that you have in this database
[119:46] so to fix this we always use
[119:48] parameterized queries
[119:50] or ORM safeguards
[119:52] the next technique to use
[119:54] is firewalls
[119:56] firewall acts as a gatekeeper
[119:58] filtering the malicious traffic
[120:00] from the other normal traffic
[120:02] so typically you have it between
[120:04] your API and the incoming traffic
[120:06] for example if you use the
[120:08] AWS's web application firewall
[120:10] this can block requests with
[120:12] unknown attack patterns
[120:14] such as suspicious SQL keywords
[120:16] or strange HTTP methods
[120:18] which means it will block any
[120:20] suspicious requests from attackers
[120:22] but it will allow others
[120:24] to bypass the request
[120:26] and reach to your API
[120:28] some APIs are also private
[120:30] and should only be accessed
[120:32] from specific networks
[120:34] that's why we have also VPNs
[120:36] which stand for virtual private networks
[120:38] the APIs that are within the VPN network
[120:40] can only be accessed
[120:42] who is also within that same network
[120:44] which means that some APIs
[120:46] are public facing
[120:48] meaning these APIs will allow any requests
[120:50] from the internet from your users
[120:52] but these for example
[120:54] can be within the VPN network
[120:56] which means if a user from web
[120:58] tries to reach your API
[121:00] then this request will be blocked
[121:02] because the user is not within
[121:04] the same network
[121:06] but on the other hand if you have another user here
[121:08] which is within the VPN network
[121:10] they can make a request
[121:12] to these APIs
[121:14] and in this case they will bypass the checks
[121:16] and their request will reach to your APIs
[121:18] this is useful where you have internal tools
[121:20] let's say you have internal admin
[121:22] dashboard and the API
[121:24] for this admin panel
[121:26] will only be reachable by employees
[121:28] connected to the company VPN
[121:30] next we have CSRF
[121:32] which stands for cross-site request forgery
[121:34] this tricks a logged in users browser
[121:36] into making unwanted requests
[121:38] to the API
[121:40] let's say you as a user
[121:42] are logged in into your bank system
[121:44] and your bank system uses cookies
[121:46] for authentication
[121:48] if the bank system is not secure
[121:50] and they only use session cookies
[121:52] another malicious site might use your cookie
[121:54] and submit a hidden
[121:56] transferring money request
[121:58] through your cookie
[122:00] so to prevent such attacks
[122:02] company also use CSRF tokens
[122:04] in combination with session cookie
[122:06] so the banking system will check
[122:08] if the session cookie is present
[122:10] but it will also check
[122:12] if the CSRF token matches
[122:14] with the one that they have
[122:16] and if it doesn't
[122:18] then it will block this request
[122:20] from the other unknown source
[122:22] while it will allow request from your behalf
[122:24] and the last one we have is XSS
[122:26] or it's also called cross-site scripting
[122:28] this lets attackers
[122:30] to inject scriptsinto web pages
[122:32] served to other users
[122:34] if you have a comment section
[122:36] and this comment gets submitted
[122:38] to your API
[122:40] next your API will also store it in a database
[122:42] you can get normal requests
[122:44] like nice picture or something like that
[122:46] and this will get to your API
[122:48] your API will store it in the database
[122:50] so everything is fine there
[122:52] but what if an attacker places
[122:54] a script in this comment section
[122:56] and within this script
[122:58] they can try to do many different things
[123:00] for example they can try
[123:02] to fetch the cookie for another user
[123:04] or they can try
[123:06] to inject something into your database
[123:08] and if you allow this
[123:10] then it will reach to your server
[123:12] and the information will be written
[123:14] into the database
[123:16] later when the other users load
[123:18] these comments section on their screen
[123:20] they will get also the injected comment
[123:22] directly into their web page
[123:24] and the browser will execute
[123:26] this malicious javascript code
[123:28] into the other users browser
[123:30] what you just went through
[123:32] were the first two sections
[123:34] of my system design mastery course
[123:36] and this is just one piece
[123:38] in my mentorship program
[123:40] if you want to go through the rest of this
[123:42] and actually master system design
[123:44] not only at theory level
[123:46] but to a point where you can design
[123:48] build and host full stock systems
[123:50] and to end under my guidance
[123:52] and get to senior and staff level
[123:54] by learning everything it takes
[123:56] to level up in your career
[123:58] i hope you like the course
[124:00] and see you in the next one
[124:02] i hope you like the course
[124:04] and see you in the next one

## 原始关键帧

### 关键帧 1

![关键帧 1](assets/bilibili-BV1ktbq6SE3w-frame-0001.webp)

### 关键帧 2

![关键帧 2](assets/bilibili-BV1ktbq6SE3w-frame-0002.webp)

### 关键帧 3

![关键帧 3](assets/bilibili-BV1ktbq6SE3w-frame-0003.webp)

### 关键帧 4

![关键帧 4](assets/bilibili-BV1ktbq6SE3w-frame-0004.webp)

### 关键帧 5

![关键帧 5](assets/bilibili-BV1ktbq6SE3w-frame-0005.webp)

### 关键帧 6

![关键帧 6](assets/bilibili-BV1ktbq6SE3w-frame-0006.webp)

### 关键帧 7

![关键帧 7](assets/bilibili-BV1ktbq6SE3w-frame-0007.webp)

### 关键帧 8

![关键帧 8](assets/bilibili-BV1ktbq6SE3w-frame-0008.webp)

### 关键帧 9

![关键帧 9](assets/bilibili-BV1ktbq6SE3w-frame-0009.webp)

### 关键帧 10

![关键帧 10](assets/bilibili-BV1ktbq6SE3w-frame-0010.webp)
