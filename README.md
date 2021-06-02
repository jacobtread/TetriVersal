![Tetri-Versal](https://raw.githubusercontent.com/jacobtread/TetriVersal/main/logo.png)

# 🍫 Tetri Versal

![NodeJs](https://img.shields.io/badge/Powered%20By-NodeJS-68A063?style=for-the-badge)
![NOT PRODUCTION READY](https://img.shields.io/badge/Not%20Ready%20For%20Production-ef4550?style=for-the-badge)
![LINES OF CODE](https://img.shields.io/tokei/lines/github/jacobtread/TetriVersal?style=for-the-badge)
![LICENSE](https://img.shields.io/github/license/jacobtread/TetriVersal?style=for-the-badge)

#### This is the server portion of the code (most of the logic ‍🏭)

###### 🚧 This is still work in progress but this server is mostly working 🚧

A small game project idea for a multiplayer Tetri style game where the controls rotate between the players developed
by [👓 Jacobtread](https://github.com/jacobtread) and [🥽 LaSpruca](https://github.com/laspruca)

The final product of the game is intended to have multiple game-modes

We are planning to use this game for a NCEA Assessment involving setting up a LAN game server this assessment is
available at
[👨‍🎓 2.6 - AS91895](https://www.nzqa.govt.nz/nqfdocs/ncea-resource/achievements/2019/as91895.pdf) This gives us the
freedom of easily meeting the legal requirements for the game along with the other requirements that must be met by the
specifications including the inability to use an internet connection on the machines. After pondering ideas for a game
to choose in class we sporadically unleashed out ideas for this game together which gave us many ideas for getting
started with this game/

The goal of this game is to be a LAN game that can be played on simple hardware with ease and little setup
(The server files will be packed into a single exe)

The host machine is not allowed connection to the internet nor are the clients, so everything will need to be
pre-packages

This game is currently in an unfinished state

### 👾 Gamemode Ideas

- "Takedown"
    - The controls are passed around, and your goal is to obtain the most points while also attempting to mess up the
      next player before the controls are swapped.
- "Teamwork"
    - Multiple players are place into a large world each with their own blocks dropping with the sole goal of getting as
      many points as possible with teamwork
- "VS" (Maybe)
    - Side by side challenge mode competing to see who can get the highest score
- "Control Swap"
    - The controls for the game are randomly swapped between the players, and they must work together to achieve a win

### 🧠 Other Ideas

- Powers / Bonuses (e.g. The users game slows down while everyone else's speeds up)
- Online multiplayer? instead of lan?

### 👾 Current Gamemodes

- [x] Teamwork
- [x] ControlSwap

### 👨‍🎓 Completed

- [x] Basic Server Implementation
- [x] Packet System
- [x] Basic game system
- [x] Testing web socket client
- [x] Text based testing client
- [x] Fix bugs in collisions system
- [x] Clean up the code
- [x] Get a websocket connection up and running with the rust game
- [x] Implement the world into the server
- [x] Re-write Packet system
- [x] Runnable server
- [x] Documentation

### 👀 TODO

- [ ] Get nathan to make a proper client

### 📦 Deployment

This application is packaged using [pkg](https://www.npmjs.com/package/pkg) this bundles our application all into one
singular executable that has its own nodejs runtime which allows us to easily distribute and setup new servers

To package TetriVersal from source you can run the following command in the directory containing the package.json

Packaging the server
```shell
npm run package
```
Packaging the test client
```shell
npm run package:client
```

### 🔨 Building
Due to the project being written with TypeScript you will have to convert the code to JavaScript before you can
run.

If you have [ts-node](https://www.npmjs.com/package/ts-node) install you can run the following command to start the server
without having to run any  other command
```shell
npm run start:ts
```

Otherwise, to build the application and start it you can run
```shell
npm run start 
```

Or if you would only like to build the application you can just run
```shell
npm run build
```
or in the project root
```shell
tsc 
```
(Note compiling the TypeScript code requires that you have the TypeScript Compiler "tsc" installed)


Code go brrrr 🧠