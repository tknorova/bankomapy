# Bankomapy

Build a modern, minimalist, mobile-friendly web application for finding ATMs in the Czech Republic. The entire user interface must be in Czech.

Main concept

The website is dedicated exclusively to finding ATMs. Its main screen should be a full-screen interactive map displaying ATMs across the Czech Republic.

The design should be extremely simple, clean, intuitive, and map-focused. Users should be able to find a suitable ATM within seconds.

Main screen

Display an interactive map that fills the entire screen.

Show ATM markers on the map.

Add a floating search button labeled "Hledat" or "Filtry".

Add a location button that centers the map on the user's current location, with permission.

Add a search field for entering a city, street, address, or place.

Keep the interface uncluttered, especially on mobile devices.

Filters

When the user clicks "Filtry", open a clean filter panel or bottom sheet.

Include these filters:

Bank: Česká spořitelna, ČSOB, Komerční banka, MONETA Money Bank, Air Bank, Raiffeisenbank, Fio banka, UniCredit Bank, mBank, and other banks.

Services: cash withdrawal, cash deposit, coin deposit, contactless ATM.

Opening hours: open now, available 24/7.

Maximum distance from the selected location, adjustable with a slider.

Accessibility: wheelchair accessible, where verified.

Include "Použít filtry" and "Vymazat filtry" buttons. Filters must actually work.

Only show options supported by the available data. Do not pretend that unknown information is verified.

ATM details

When a user clicks an ATM marker, show a small information card containing:

Bank or operator

Address

Available services

Opening hours, if known

Distance from the user's selected location

A button labeled "Navigovat", opening directions in a mapping application

Clearly distinguish unknown information from confirmed information.

Data and map

Use OpenStreetMap-compatible data as the initial source of ATM locations. Use a suitable interactive mapping library such as MapLibre if appropriate.

Before implementing the entire application, check whether a reliable ATM data source is available. Do not invent ATM locations or fake service information.

Keep the data layer separate from the user interface so additional official bank data sources can be integrated later.

Respect the data provider's usage limits, licensing, and attribution requirements. Do not send repeated requests to public APIs for every map movement. Use appropriate caching or a suitable data-loading strategy.

Technical requirements

Use React and TypeScript.

Make the application responsive and optimized for mobile browsers.

Keep the code modular and maintainable.

Include loading states, empty states, and error handling.

Request location permission only when necessary.

Never expose private API keys in frontend code.

Avoid paid services unless necessary and ask me before introducing costs.

Development process

First, build the visual layout and working map interface. Then connect real ATM data and implement functional filters.

Do not claim that the app has complete or verified ATM coverage until this has actually been checked.

Explain important technical decisions in simple language. Make reasonable implementation decisions without asking me about every small detail.

The final goal is a working, deployable web application, not just a static mockup.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3cfd1cb1-0b9e-5198-bb27-310ed93be3e5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
