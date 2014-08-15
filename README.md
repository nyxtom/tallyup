# tally

Tally is a simple stats, ratings, generic command processing and aggregation server 
similar to statsd. Tallyd includes the server for starting things up (tallyd) and a
management server for issuing simple commands to determine the state of
things. Tallyd also has the ability to flush to listeners. In short, tally 
is a network daemon that runs in Node.js sent over TCP (instead of UDP).

## Inspiration
Tallyd was inspired by statsd and has some basic implementation
differences with relation to aiming for stream reuse, code separation,
management cli, command line configuration, and generic command
processing (which can be later used for extensible process handlers).

## Installation and Configuration
* Setup node.js (> 0.10.x)
* Clone tally
* Start up tallyd or symlink bin/tallyd
* (Command line parameters are available to tallyd --help)

## Usage
The basic line protocol is identical to statsd sent via TCP.

```
<metricname>:<value>|<type>
```

You can send a simple metric from command line using something like nc.

```
echo "movie:3|rate" | nc 127.0.0.1 8711
```

## Types

### Counting
Similar to statsd, a counter will add the amount to the bucket. At each
flush interval the current count is sent and reset to 0.

```
requests:1|incr
```

### Aggregates
Aggregates are automatically calculated for various items. For instance,
if you perform the **incr** command type, then a counter is tracked as
well as the aggregate sum long term. This allows us to keep track of the
rate per second of a given counter, flush counts over time, and store the
total amount for a key.

### Ratings
Ratings are useful for keeping track of a value that might be within a
range of static ratings. For instance, if you are tracking the ratings on
products or movies, you can use this type to keep track of the
**aggregate** number of ratings supplied to a key, the aggregate average
rating, the **aggregate** of all the rating values, as well as the ratings
per second as tracked by **counters**.

```
movieid:3|rate
```

## License
Copyright (c) 2014 Thomas Holloway  
Licensed under the MIT license.
