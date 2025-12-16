# LachlanM05's Website

The source code for lachlanm05.com. A personal portfolio, landing page, and home to projects like DDMC, Goober and a few more to come :3

    "LachlanM05, wishes to be just a little guy."
                                  - LachlanM05 2025 

## About

This repository contains the frontend code and server configurations for my personal website. It serves as a hub for my projects, and writing. The site is built primarily with static HTML, CSS, and vanilla JavaScript, running behind an Apache reverse proxy.

## Features

    Splash Screen: A welcoming entrance

    Custom UTM Tracking: A lightweight, custom-built analytics script that tracks referral sources (e.g., My steam profile) and sends data to a backend API without heavy third-party trackers.

    Seasonal Events: The site reacts to specific dates with visual and audio effects (see below).

    Project Pages: Dedicated landing pages for projects like DDMC (Doki Doki Modding Club [used to be Goober too, but it kinda lowkey sucked]).

    Responsive Design: Mobile-friendly layout (mostly).

## Tech Stack

    Frontend: HTML5, CSS3, JavaScript (Vanilla)

    Server: Apache HTTPD (Reverse Proxy)

    OS: Arch Linux (server-side)

    Automation: Shell scripts for automated deployment

## Seasonal & Dynamic Effects

The website contains an event system (assets/main.js and assets/mc-app.js) that triggers specific effects based on the date.
| Date |	Event	Effect |
| ------- | ---------- |
| Jan 1	| New Years	Fireworks display (guaranteed burst at 00:00). |
| Feb 14 |	Valentine's	Floating hearts loop. |
| Jul 22 |	Birthday	Plays birthday.mp3 (My birthday :3). |
| October |	Halloween	Cobwebs appear in the top corners. |
| December | Terrible (but cute) snowflakes fall from the screen |

### Testing Events

You can force an event to trigger by using the console to set a fake date:
JavaScript

// Set date to Halloween
setFakeDate("2025-10-31T20:00:00");

// Clear the fake date
clearFakeDate();

## Project Structure

    /: Root HTML files (index.html, ddmc.html, mc-twist.html).

    /assets: Static assets including images, the DDMC zip/exe files, global styles (style.css), and logic (main.js).

    /global: Custom error pages (404, 500, etc.).

    /sys: Server-side configuration and automation.

        /sys/automation: Shell scripts (deploy-main-repo.sh) used to keep the server in sync with GitHub releases.

        /sys/httpd: Replica of the Apache HTTPD configuration used in production.

## Deployment

Deployment is handled via the scripts located in sys/automation. Since 16/12/25, the server automatically pulls and deploys changes from this repository.
### Projects Included
DDMC (Doki Doki Modding Club)

A Python-based mod manager for Doki Doki Literature Club.

    Features: Playtime tracking, Discord Rich Presence, Profile management.

    Page: ddmc.html

Goober

A generic Mii-inspired avatar creator.

## License

This project is Open-Source with the [MIT License](https://github.com/LachlanM05/website/blob/main/LICENSE)

© 2025 LachlanM05
