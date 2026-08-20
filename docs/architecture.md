# Application Architecture

## 1. Overview

The application is divided into four main responsibilities:

- React 18 handles the user interface and client-side state.
- Laravel 11 handles authentication, validation and business rules.
- PostgreSQL stores the authoritative application state and enforces data integrity.
- Node.js with `ws` distributes real-time updates to connected clients.

The main architectural principle is that WebSocket communication does not replace the HTTP API or the database as the source of truth.

A vote is first validated and persisted. Only after a successful database operation is the new result propagated to connected clients.

## 2. High-level Architecture

```text
React
  |
  | HTTP
  v
Laravel
  |
  | authentication
  | validation
  | business rules
  v
PostgreSQL
  |
  | successful persistence
  v
Laravel
  |
  | internal notification
  v
Node.js + ws
  |
  | poll-specific broadcast
  v
Connected React clients
```

### Responsibilities

#### React

Responsible for:

- rendering the poll wall;
- poll creation interface;
- voting interaction;
- result visualization;
- loading and error states;
- WebSocket connection state;
- reconnecting and synchronizing state.

#### Laravel

Responsible for:

- guest authentication through Sanctum;
- API endpoints;
- request validation;
- poll creation;
- voting rules;
- duplicate vote handling;
- poll closing rules;
- calculating poll results.

#### PostgreSQL

Responsible for:

- persistent application state;
- relationships between users, polls, options and votes;
- enforcing critical data invariants.

#### Node.js + ws

Responsible for:

- WebSocket connections;
- poll subscriptions;
- broadcasting result changes;
- reconnect-compatible communication;
- detecting dead connections.

## 3. Repository Structure

The project uses a monorepository because the challenge contains three applications that must work together but are still part of one small product.

```text
fantasy-draft-test/
├── backend/
├── frontend/
├── websocket/
├── docs/
├── README.md
└── .gitignore
```

This keeps local setup and evaluation simple while preserving clear responsibilities between applications.

## 4. Domain Model

The initial domain contains four entities:

```text
User
Poll
PollOption
Vote
```

### User

Represents the technical identity of a participant.

The challenge does not require traditional login or registration, so users are created automatically as guests.

A user can:

- create many polls;
- vote in many polls.

### Poll

Represents a poll created by a user.

Main attributes:

- integer id;
- creator;
- question;
- optional closing time;
- timestamps.

A poll:

- belongs to one creator;
- contains many options;
- contains many votes.

### PollOption

Represents one possible answer.

Main attributes:

- integer id;
- poll id;
- label;
- position;
- timestamps.

### Vote

Represents one user's choice in one poll.

Main attributes:

- integer id;
- poll id;
- poll option id;
- user id;
- creation timestamp.

## 5. Data Integrity

One of the most important business rules is:

> one user can vote only once in the same poll.

Application validation alone is not enough because two concurrent requests could both pass an existence check before either insert is completed.

For that reason, PostgreSQL will enforce:

```text
UNIQUE (poll_id, user_id)
```

The application can still check for an existing vote to return a clear response, but the database remains the final integrity guarantee.

The backend must also verify that the selected option belongs to the poll receiving the vote.

## 6. Guest Authentication

The challenge requires poll routes to use:

```text
auth:sanctum
```

while explicitly stating that login and registration are not required.

The application therefore uses an automatic guest identity.

### Guest bootstrap flow

```text
React starts
     |
     v
request CSRF cookie
     |
     v
POST /api/guest-session
     |
     +---- authenticated session exists
     |             |
     |             v
     |         reuse user
     |
     +---- no authenticated session
                   |
                   v
             create guest user
                   |
                   v
           authenticate session
```

After this bootstrap, poll routes can remain protected with `auth:sanctum`.

This provides a technical identity without introducing a login or registration experience that was not requested by the challenge.

### Limitation

If the user removes browser session data, the application cannot guarantee that the same physical person will be recognized again.

A stronger guarantee would require a persistent real-world identity, which is outside the scope of the challenge.

The rule implemented by this project is therefore one vote per authenticated guest identity per poll.

## 7. Poll Creation

Creating a poll also creates all of its options.

These operations form one logical unit and should run inside a database transaction.

```text
create poll
    |
create options
    |
all operations succeed?
    |
  yes ---> commit
  no  ---> rollback
```

This prevents an incomplete poll from being persisted if option creation fails.

## 8. Voting Flow

A vote follows this path:

```text
POST /api/polls/{poll}/votes
            |
            v
Sanctum authentication
            |
            v
request validation
            |
            v
check poll state
            |
            v
check option belongs to poll
            |
            v
check previous vote
            |
            v
persist vote
            |
            v
database commit
            |
            v
calculate current results
            |
            v
notify real-time service
```

A WebSocket delivery failure must not roll back a vote that has already been successfully persisted.

## 9. HTTP and WebSocket Responsibilities

HTTP is used for commands and authoritative state retrieval.

Examples:

- create poll;
- list polls;
- load poll;
- submit vote.

WebSocket is used to notify connected clients about state changes.

This keeps business rules inside Laravel instead of duplicating them in the Node.js server.

## 10. Real-time Subscriptions

A connected client subscribes only to the poll currently being viewed.

Example:

```json
{
  "type": "poll.subscribe",
  "pollId": 12
}
```

Conceptually, the WebSocket server maintains groups such as:

```text
poll:12
├── client A
├── client B
└── client C

poll:20
├── client D
└── client E
```

An update to poll 12 is sent only to clients A, B and C.

This models the same general room-based real-time interaction described in the challenge without broadcasting unrelated events to every connected client.

## 11. Laravel to WebSocket Communication

After a successful mutation, Laravel needs to notify the Node.js WebSocket service.

The initial implementation uses an internal HTTP request.

```text
Laravel
   |
   | internal HTTP request
   v
Node.js
   |
   v
WebSocket subscribers
```

This approach was chosen because it is:

- explicit;
- easy to understand;
- easy to test locally;
- sufficient for the challenge scope;
- free from additional infrastructure dependencies such as Redis.

If this application needed to operate at a much larger scale, an asynchronous message broker could be evaluated later.

## 12. Real-time Payload Strategy

Result updates will contain the current result snapshot instead of only a vote increment.

Example:

```json
{
  "type": "poll.results.updated",
  "pollId": 12,
  "payload": {
    "total_votes": 128,
    "options": []
  }
}
```

Poll result payloads are small, so sending the current snapshot simplifies the frontend and reduces synchronization problems caused by missing or duplicated incremental events.

## 13. Reconnection Strategy

WebSocket delivery is not guaranteed while a client is disconnected.

Example:

```text
client shows 50 votes
       |
connection lost
       |
votes 51, 52 and 53 happen
       |
connection restored
```

Simply reconnecting would leave the client with stale state.

For that reason, reconnection follows this flow:

```text
connection restored
        |
subscribe again
        |
reload poll through HTTP
        |
replace local state
        |
continue receiving events
```

The WebSocket informs the client that something changed.

The HTTP API provides the authoritative state.

## 14. Connection Health

The WebSocket server will use ping/pong heartbeat checks.

This allows the server to detect clients that are no longer reachable even when the connection has not been closed cleanly.

Dead connections can then be removed from active subscription groups.

## 15. Poll Closing

The backend determines whether voting is still allowed using the poll's `closes_at` value.

The frontend may display a countdown, but the browser clock is never trusted to authorize a vote.

```text
Frontend countdown
        =
user experience

Backend closes_at validation
        =
business rule
```

This prevents client-side manipulation from bypassing poll closing rules.

## 16. API Response Strategy

The challenge requires direct JSON responses without a top-level `data` wrapper.

Resources may still be used in Laravel, but wrapping must be disabled.

Poll responses can contain derived information such as:

- current status;
- total votes;
- vote count per option;
- percentage per option;
- whether the authenticated user has voted;
- which option the authenticated user selected.

Derived values such as percentages and poll status do not need to be persisted as separate database fields.

## 17. Error Strategy

Expected domain conflicts should return meaningful HTTP status codes and machine-readable error codes.

Example:

```json
{
  "message": "You have already voted in this poll.",
  "code": "already_voted"
}
```

Important domain cases include:

- `already_voted`;
- `poll_closed`;
- `invalid_option`.

This allows the React interface to react to known errors without depending only on human-readable text.

## 18. Main Technical Trade-offs

### Guest session instead of traditional authentication

Chosen because Sanctum authentication is required while login and registration are explicitly outside the challenge scope.

### Database constraint for duplicate votes

Chosen because application checks alone cannot guarantee integrity under concurrent requests.

### HTTP for mutations and WebSocket for propagation

Chosen so business rules have one owner: Laravel.

### Internal HTTP between Laravel and Node.js

Chosen to avoid adding unnecessary infrastructure to a small technical challenge.

### Result snapshot instead of incremental events

Chosen because poll result payloads are small and synchronization becomes simpler.

### Monorepository

Chosen because backend, frontend and WebSocket server belong to one deliverable and need to be easy for the evaluator to run locally.