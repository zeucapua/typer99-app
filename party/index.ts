import { faker } from "@faker-js/faker";
import type * as Party from "partykit/server";

type Player = {
  conn_id: string,
  name: string,
  score: number,
  is_ready: boolean,
};

export default class Server implements Party.Server {

  constructor(readonly party: Party.Party) {}

  // each party's local data;
  party_state : "lobby" | "running" | "ending" = "lobby";
  target_string = "";
  players : Player[] = [];
  finished : { id: string, result: number }[] = [];

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // create a player
    this.players.push({
      conn_id: conn.id,
      name: "",
      score: 0,
      is_ready: false
    });

    conn.send(JSON.stringify({
      type: "connected",
      values: { conn_id: conn.id }
    }));
    
    this.mirror();
  }

  onMessage(message: string, sender: Party.Connection) {
    // parse JSON message
    const { type, values } = JSON.parse(message);

    // check the party state (in lobby, in game, or game ended)
    if (this.party_state === "lobby") {
      switch (type) {
        case "ready": {
          let num_ready = 0;

          // update player ready
          this.players.map((p) => {
            if (p.conn_id === sender.id) { p.is_ready = values.is_ready };
            if (p.is_ready) { num_ready += 1; }
          });
          this.mirror();

          // TODO: refactor to show starting and allow unready to cancel
          if (num_ready === this.players.length) {
            setTimeout(() => {
              this.party.broadcast(JSON.stringify({ type: "startGame" })); 
              this.party_state = "running";
              this.target_string = faker.word.words({ count: 25 });
              this.finished = [];
              this.mirror();
            }, 5000);
          }

          break;
        }
        case "updateName": {
          // update player name
          this.players.map((p) => {
            if (p.conn_id === sender.id) p.name = values.name;
          });

          this.mirror();
          break;
        }
      }
    }

    else if (this.party_state === "running") {
      switch (type) {
        
        // when a player is finished
        case "finished": {
          const result =  values.result; 
          this.finished.push({ id: sender.id, result });

          if (this.finished.length === this.players.length) {
            this.party_state = "ending";
            for (let i = 0; i < this.finished.length; i++) {
              const results = this.finished[i];
              this.players.map((p) => {
                // unready 
                p.is_ready = false;

                // calculate bonus 
                if (results.id === p.conn_id) {
                  p.score = results.result + (
                    i === 0 ? 3
                    : i === 1 ? 2
                    : i === 2 ? 1 
                    : 0
                  )
                }
              });
            }
          }
          this.mirror();
        }

      }
    }

    else if (this.party_state === "ending") {
      // what to do in ending screen?
      // emoji? chat?
      switch (type) {
        case "mirror": {
          this.mirror();
          break;
        }
        case "ready": {
          console.log("ending ready", { values, players: this.players });
          let num_ready = 0;

          // update player ready
          this.players.map((p) => {
            if (p.conn_id === sender.id) { p.is_ready = values.is_ready };
            if (p.is_ready) { num_ready += 1; }
          });

          if (num_ready >= this.players.length) {
            this.players.map((p) => {
              p.score = 0;
              p.is_ready = false;
            });
            this.party_state = "lobby";
            this.mirror();
          }
        }
      }
    }
  }

  // when a connection leaves, remove a Player associated
  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
     this.players = this.players.filter((p) => p.conn_id !== connection.id);
  }

  mirror() {
    const data = { type: "mirror", values: {} };
    switch (this.party_state) {
      case "lobby": {
        data.values = {
          party_state: this.party_state,
          players: this.players,
        }
        break;
      }
      case "running": {
        data.values = {
          party_state: this.party_state,
          players: this.players,
          target_string: this.target_string,
          finished: this.finished
        }
        break;
      }
      case "ending": {
        data.values = {
          party_state: this.party_state,
          players: this.players
        }
        break;
      }
    }

    this.party.broadcast(JSON.stringify(data));
  }
}

Server satisfies Party.Worker;
