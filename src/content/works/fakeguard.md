---
title: FakeGuard
role: Tech Utsav
tags: [Python, FastAPI, React, TypeScript, Rule-based scoring]
link: https://fakeguard-alpha.vercel.app
---

A full-stack prototype that analyzes social media account data and helps human reviewers decide **which accounts to look at first**.

- **Rule-based, explainable risk score** from 0 to 100: a weighted combination of five profile and activity features (account age, follower/following ratio, posting frequency, profile completeness, engagement), sorted into LOW, MEDIUM, HIGH and CRITICAL
- **Feature-by-feature breakdown** and reason codes that explain each risk indicator
- **Dashboard analytics** and **CSV import** for batch scoring
- All weights and thresholds live in one file; the Methodology page and docs are generated from it, and tests fail if they drift apart

The current version uses no machine learning: the scores come from fixed weights and thresholds. ML-based detection (for example Isolation Forest anomaly detection and behavioural clustering) is planned future work.

**Stack:** React 18 + TypeScript + Vite on the front, FastAPI + Pydantic + SQLAlchemy + SQLite on the back, tested with pytest and Vitest.

> Built on synthetic data as decision support. It doesn't touch real platforms or make final calls on authenticity.

[Source on GitHub](https://github.com/yo5on/fakeguard)
