import type * as Party from "partykit/server";

type Player = {
  conn_id: string,
  name: string,
  score: number
};

export default class Server implements Party.Server {

  constructor(readonly party: Party.Party) {}

  // each party's local data;
  party_state : "lobby" | "running" | "ending" = "lobby";
  target_string = "";
  players : Player[] = [];

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
      id: ${conn.id}
      room: ${this.party.id}
      url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // check the party state (in lobby, in game, or game ended)
    if (this.party_state === "lobby") {
      switch (message) {
        case "ready": {
          this.party_state = "running"
          break;
        }
      }
    }

    else if (this.party_state === "running") {
      switch (message) {

        // sent by a player who won the game first
        case "winner": {
          this.party_state = "ending";
          this.players.map((p) => {
            // give player a score
            if (p.conn_id === sender.id) { p.score += 1; }
          });
          break;
        } 
      }
    }

    else if (this.party_state === "ending") {

    }
  }

  // when a connection leaves, remove a Player associated
  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
     this.players = this.players.filter((p) => p.conn_id !== connection.id);
  }
}

Server satisfies Party.Worker;
