---
title: Gesture-Controlled RC Car
banner: https://raw.githubusercontent.com/yo5on/Gesture-control-rc-car/main/pic/pic1.jpeg
tags: [ESP32, MPU6050, ESP-NOW]
link: https://github.com/yo5on/Gesture-control-rc-car
---

Drive a car by **tilting your hand**.

Two ESP32 boards: the transmitter reads an **MPU6050** accelerometer and maps tilt to forward, backward, left, right or stop. It sends the command over **ESP-NOW** to the receiver, which drives the motors.

- Configurable dead zone so a resting hand means *stop*
- Pivot turns and adjustable motor speed
- Serial output for tuning and debugging
