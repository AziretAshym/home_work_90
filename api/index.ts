import express from "express";
import expressWs from "express-ws";
import cors from "cors";
import { WebSocket } from "ws";

const app = express();
expressWs(app);

const port = 8000;

app.use(cors());

const router = express.Router();

const connectedClients: WebSocket[] = [];

interface IncomingMessage {
    type: string;
    payload: string;
}

router.ws('/canvas', (ws, _req) => {
    connectedClients.push(ws);
    console.log('Client connected. Total clients:', connectedClients.length);

    ws.send(JSON.stringify({
        type: "initialData",
        payload: [],
    }));

    ws.on('message', (message) => {
        let decodedMessage: IncomingMessage;
        try {
            decodedMessage = JSON.parse(message.toString()) as IncomingMessage;

            if (decodedMessage.type === "DRAW_PIXEL") {
                connectedClients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "DRAW_PIXEL",
                            payload: decodedMessage.payload,
                        }));
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }
    });

    ws.on('close', () => {
        const index = connectedClients.indexOf(ws);
        if (index !== -1) {
            connectedClients.splice(index, 1);
        }
        console.log('Client disconnected. Total clients:', connectedClients.length);
    });
});

app.use(router);

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
