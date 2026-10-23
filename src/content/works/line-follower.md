---
title: High-Speed PID Line Follower
banner: https://raw.githubusercontent.com/yo5on/line-follower/main/images/pic2.jpeg
tags: [ESP32, C / C++, PID, Robotics]
link: https://github.com/yo5on/line-follower
---

An autonomous line follower that keeps stable tracking through curves and sharp turns **at speed**.

An 8-array IR sensor reads the line position. The ESP32 computes the tracking error, and a **PID controller** continuously rebalances the two N20 gear motors through a TB6612FNG driver.

![Line follower robot](https://raw.githubusercontent.com/yo5on/line-follower/main/images/pic1.jpeg)

- PID-based tracking with adjustable gains
- Analog sensor position detection through an 8-channel multiplexer
- Two-cell Li-ion supply with buck converters for clean rails
