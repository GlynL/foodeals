# foodeals

A curated catalogue of recurring food deals, maintained by hand and browsed for discovery.

## Language

**Deal**:
A recurring offer at a venue, valid on one or more days of the week.
_Avoid_: Offer, promotion, voucher

**Venue**:
The place offering a deal.
_Avoid_: Restaurant, shop, merchant

**Discount**:
A free-text description of what a deal gives; it has no structure because discounts share no common shape.
_Avoid_: Price, saving, amount

**Location**:
A map link to the venue.
_Avoid_: Address

**Day**:
One of the seven recognised day names, `Mon` to `Sun`, on which a deal recurs. Deals carry no dates.
_Avoid_: Date, weekday

**Catalogue**:
The full set of deals the operator curates.
_Avoid_: Database, feed, list

**Operator**:
The person who curates the catalogue by hand-editing it.
_Avoid_: Admin, user

**Day filter**:
Narrowing a catalogue listing to the deals valid on one given day.
_Avoid_: Today filter, date filter

## Architecture

**Core**:
The surface-free part of the system that holds the deal model and loads, validates and lists the catalogue.

**Surface**:
A way of reaching the core from outside: the CLI, the HTTP API and, later, the web.
_Avoid_: App, front end, interface
