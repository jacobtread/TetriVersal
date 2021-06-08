# Packets
This file contains the descriptions for each packet that is sent and received by the game all packets are just encoded to JSON


## Server Packets
These are packets sent by the server to the client

### Keep Alive Packet
Sent by the sever when a keep alive is received

| name | type   | value |
|------|--------|-------|
| id   | number | 0     |

### Join Response Packet
Sent to a client after a join is successful

| name | type   | value            |
|------|--------|------------------|
| id   | number | 1                |
| uuid | string | Your player UUID |

### Join Failed Packet
Sent to a client if a join failed

| name   | type   | value                              |
|--------|--------|------------------------------------|
| id     | number | 2                                  |
| reason | string | The reason why you failed to join  |

### Disconnect Packet
Send to the client if they have been disconnected

| name   | type   | value                              |
|--------|--------|------------------------------------|
| id     | number | 3                                  |
| reason | string | The reason why you failed to join  |


### Player Join Packet
Sent to all clients when someone joins the game

| name | type   | value                               |
|------|--------|-------------------------------------|
| id   | number | 4                                   |
| uuid | string | The UUID of the player that joined  |
| name | string | The name of the player that joined  |

### Player Leave Packet
Sent to all clients when someone leaves the game

| name   | type   | value                           |
|--------|--------|---------------------------------|
| id     | number | 5                               |
| uuid   | string | The UUID of the player who left |
| reason | string | The reason they left            |

### Game Started Packet
Sent to all clients when the game starts

| name | type   | value |
|------|--------|-------|
| id   | number | 6     |

### Time Till Start Packet
Sent to all clients telling them how many seconds are left until the game starts

| name | type   | value                        |
|------|--------|------------------------------|
| id   | number | 7                            |
| time | number | Time in seconds before start |

### Game Over Packet
Sent to all clients when the game is over

| name | type   | value  |
|------|--------|--------|
| id   | number | 8      |

### Control Packet
Sent to the client that currently has controls letting them know
they can send input

| name | type   | value  |
|------|--------|--------|
| id   | number | 9      |

### Controls Packet
Sent to all other clients indicating the player that has control

| name | type   | value                                   |
|------|--------|-----------------------------------------|
| id   | number | 10                                      |
| uuid | string | The UUID of the player that has control |
| name | string | The name of the player that has control |

### Bulk Update Packet

Sent to all the clients and contains a serialized list of strings
(the number grid just put into strings to decrease packet size and decoding time) The following is a example of the structure
```typescript
// The unserialized grid
const grid: number[][] = [[0,1,0], [1,1,1], [1,1,1]]
// The serialized grid
const serialized: string[] = ["010", "111", "111"]
```
This results in shorter JSON code
Un-serialized JSON.stringify
```json
[[0,1,0],[1,1,1],[1,1,1]]
```
Serialized JSON.stringify
```json
["010","111","111"]
```
Its quite visible this saves a lot of space (More visible with larger data)

| name  | type     | value                        |
|-------|----------|------------------------------|
| id    | number   | 11                           |
| lines | string[] | The serialized string array  |

### Active Tiles Packet

Sent to the client to indicate the shape of the current tile

| name  | type     | value                            |
|-------|----------|----------------------------------|
| id    | number   | 12                               |
| tiles | number[] | A 2D grid representing the shape |

### Next Tiles Packet

Sent to the client to indicate the shape of the next  tile

| name  | type     | value                            |
|-------|----------|----------------------------------|
| id    | number   | 13                               |
| tiles | number[] | A 2D grid representing the shape |

### Position Packet

Sent to the client to indicate the current position of the moving shape

| name | type | value
|----|--------|-----------------------------|
| id | number | 14
| x  | number | The x position of the shape
| y  | number | The y position of the shape

### Rotate Packet

Sent to the client to indicate the piece has been rotated

| name | type | value
|------|------|----------|
| id | number | 15

### Score Packet

Sent to the client to indicate the current score

| name | type | value
|------|------|---------|
| id | number | 16
| score | number | The current player score

### Map Size Packet

Broadcast to all clients telling them the width and height of the map so that they can make a grid to display before a bulk update happens

| name | type | value
|------|------|----------|
| id | number | 17
| width | number | The width of the map
| height | number | The height of the map

### Game Modes Packet

Broadcast to all clients telling them which game modes are available to vote for

| name | type | value
|------|------|------------|
| id | number | 18
| modes | GameMode[] | The available game modes

A game mode is an object containing a name and option

#### GameMode:

| name | type
|------|-----
| mode | number
| name | string

### Other Piece Packet
Used in teamwork mode to indicate where the piece is of another player in the game

| name | type | value
|------|------|----------|
| id   | number | 19
| x    | number | The x position of the piece
| y    | number | The y position of the piece
| tiles | number[] |  A 2D grid representing the shape

### Cleared Rows Packet

Sent to all clients after one or more rows get cleared

| name | type | value
|------|------|---------|
| id | number | 20
| rows | number[] | The y index's of the cleared row

## Client Packets

### Keep Alive Packet
Sent to the server telling it the client is still alive

| name | type   | value
|------|--------|-------|
| id   | number | 0

### Join Request Packet
Sent to let the server know you want to connect with the provided name

| name | type   | value
|------|--------|-----------------------------|
| id   | number | 1
| name | string | The name the player wants

### Input Packet
Sent to let the server know when a key is being pushed by the player

##### Key Mappings
| key | mapped
|-----|--------
| left | left
| right | right
| up | rotate
| down | down


| name | type | value
|------|------|---------|
| id | number | 2
| key | string | The key that was push (mapped value)

### Disconnect Packet
Sent to let the server know this player is disconnecting

| name | type | value
|------|------|---------|
| id | number | 3
| reason | string | The reason the player wants to disconnect

### Vote Packet
Sent to let the server know which game mode this player is voting to play

| name | type | value
|------|------|--------|
| id | number | 4
| mode | number | The game mode the player voted for
