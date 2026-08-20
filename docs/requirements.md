# Product Requirements

## Objective

Build a live polling wall where users can create polls, vote, and follow result changes in real time without refreshing the page.

The feature should represent, on a smaller scale, the same multi-user real-time interaction pattern used in FantasyDraft live rooms.

## Product References

The product direction is based on:

- FantasyDraft for visual identity, lobby structure, cards, pills, empty states, forms and sports-oriented language.
- Sleeper for live sports UX, real-time state presentation and poll result patterns.

The goal is not to copy either interface, but to create a feature that feels consistent with the FantasyDraft product.

## Actors

### Guest user

A visitor receives an automatically created guest identity and can:

- browse polls;
- create polls;
- open a poll;
- vote once;
- follow results in real time.

There is no traditional login or registration flow.

## Functional Requirements

### RF01 — Guest session

The application must create or restore a guest session so protected poll routes can use Sanctum authentication without requiring login or registration.

### RF02 — Poll wall

The user must be able to view available polls and distinguish open polls from closed polls.

### RF03 — Poll creation

The user must be able to create a poll containing:

- one question;
- at least two options;
- an optional closing duration.

### RF04 — Poll details

The user must be able to open one poll and view its current state.

### RF05 — Voting

An authenticated guest user must be able to select one option and submit one vote.

### RF06 — Duplicate vote prevention

A user must not be able to vote more than once in the same poll.

### RF07 — Live results

When a valid vote is registered, users currently viewing that poll must receive the updated results without refreshing the page.

### RF08 — Poll closing

When a poll has a closing time and that time is reached, new votes must be rejected.

### RF09 — Result visualization

Results must show:

- vote count by option;
- percentage by option;
- total votes.

### RF10 — Real-time connection state

The interface must indicate when the live connection is active or reconnecting.

### RF11 — Reconnection synchronization

After a WebSocket reconnection, the client must fetch the authoritative poll state again before continuing.

## Business Rules

### RN01

A poll question is required.

### RN02

A poll must contain between 2 and 10 valid options.

### RN03

Empty poll options are not accepted.

### RN04

A vote option must belong to the poll receiving the vote.

### RN05

A user can cast only one vote per poll.

### RN06

The poll creator is allowed to vote.

### RN07

A closed poll cannot receive new votes.

### RN08

A null closing time means the poll does not close automatically.

### RN09

The backend is authoritative when deciding whether a poll is closed.

### RN10

A real-time update must only be emitted after the vote has been successfully persisted.

### RN11

Frontend vote blocking improves the user experience but cannot be the only protection against duplicate voting.

### RN12

The database must guarantee the one-vote-per-user-per-poll invariant.

## Non-functional Requirements

### RNF01

Backend must use Laravel 11 with PHP 8.3.

### RNF02

Persistence must use PostgreSQL.

### RNF03

Frontend must use React 18.

### RNF04

Real-time communication must use Node.js with the `ws` WebSocket library.

### RNF05

Database primary keys must use auto-incrementing integer IDs.

### RNF06

Poll domain routes must be protected by `auth:sanctum`.

### RNF07

API responses must return direct JSON without a top-level `data` wrapper.

### RNF08

React code must be componentized and hooks must keep side effects and state logic organized.

### RNF09

Styles must use CSS Modules or an equivalent scoped approach.

### RNF10

The WebSocket server must support poll-specific subscriptions instead of broadcasting every event to every connection.

### RNF11

The WebSocket server must detect dead connections.

### RNF12

Configuration and secrets must be provided through environment variables.

### RNF13

Critical business rules must have automated tests.

## Main User Stories

### US01 — Browse polls

As a participant, I want to see available polls so I can choose one to participate in.

### US02 — Create a poll

As a participant, I want to create a poll with a question and options so other users can vote.

### US03 — Vote

As a participant, I want to choose one option so my vote is included in the poll.

### US04 — Prevent duplicate voting

As the system, I want to prevent the same participant from voting twice so poll results remain consistent.

### US05 — Follow live results

As a participant, I want poll results to update automatically when other users vote so I can follow the poll live.

### US06 — Automatically close a poll

As a poll creator, I want to optionally define how long voting stays open so the poll can finish automatically.

## Core Acceptance Criteria

### Poll creation

Given a valid guest session  
When the user submits a question with at least two valid options  
Then the poll and its options are persisted  
And the created poll can be opened.

### Valid vote

Given an open poll  
And the current user has not voted  
When the user selects an option belonging to that poll  
Then exactly one vote is persisted  
And updated results are returned.

### Duplicate vote

Given the current user has already voted in a poll  
When another vote is submitted for the same poll  
Then the request is rejected  
And no additional vote is persisted.

### Closed poll

Given the poll closing time has passed  
When a user attempts to vote  
Then the request is rejected  
And poll results remain unchanged.

### Live update

Given multiple users are viewing the same poll  
When one user registers a valid vote  
Then the connected users receive the updated result without refreshing the page.

### Reconnection

Given a user temporarily loses the WebSocket connection  
When the connection is restored  
Then the client subscribes to the poll again  
And reloads the current authoritative poll state.
