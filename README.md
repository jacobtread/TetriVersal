![Tetri-Versal](https://raw.githubusercontent.com/jacobtread/TetriVersal/main/logo.png)

#  🤖 Tetri Versal 

![NodeJs](https://img.shields.io/badge/Powered%20By-NodeJS-68A063?style=for-the-badge)
![NOT PRODUCTION READY](https://img.shields.io/badge/Not%20Ready%20For%20Production-ef4550?style=for-the-badge)

####  This is the server portion of the code (most of the logic ‍🏭)

A small game project idea for a multiplayer Tetri style game where the controls rotate between the players developed
by [👓 Jacobtread](https://github.com/jacobtread) and [🥽 LaSpruca](https://github.com/laspruca)

The final product of the game is intended to have multiple game-modes

This game is being made to be used as our lan game for the NCEA
Assignment [👨‍🎓 2.6 - AS91895](https://www.nzqa.govt.nz/nqfdocs/ncea-resource/achievements/2019/as91895.pdf) instead of us
having to use another game we decided to make our own and after pondering ideas in class we game up with this game idea

The goal of this game is to be a LAN game that can be played on simple hardware with ease and little setup
(The server files will be packed into a single exe)

The host machine is not allowed connection to the internet nor are the clients, so everything will need to be
pre-packages

This game is currently in an unfinished state

### 👾 Gamemode Ideas

- "Takedown" - The controls are passed around, and your goal is to obtain the most points while also attempting to mess
  up the next player before the controls are swapped.
    - 3+ players
- "Teamwork" - Multiple players are place into a large world each with their own blocks dropping with the sole goal of
  getting as many points as possible with teamwork
    - 3+ players
- "VS" (Maybe) - Side by side challenge mode competing to see who can get the highest score
- "Control Swap" - The controls for the game are randomly swapped between the players and they must work 
together to achieve a win
  
### 👨‍🎓 Completed

- [x] Basic Server Implementation
- [x] Packet System
- [x] Basic game system
- [x] Testing web socket client
- [x] Text based testing client

### 👀 TODO

- [x] Fix bugs in collisions system
- [x] Clean up the code
- [ ] Get a websocket connection up and running with the Unity game
- [ ] Implement the world into the server
- [ ] Documentation
  - Kind of making progress on this, but it will just end up happening as I go
  or just when I get bored
- [x] Re-write Packet system 

Code go brrrr 🧠