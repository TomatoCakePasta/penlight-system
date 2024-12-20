import io from "socket.io-client";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const PORT = process.env.PORT || 3000;

const SERVER_URL =process.env.NODE_ENV === 'production' ? `https://${process.env.URL}:${PORT}` : `${process.env.URL}:${PORT}`;
const NUM_CLIENTS = 100;

let clients = [];
let responseTimes = [];

let isAll = 0;

console.log(SERVER_URL);

for (let i = 0; i < NUM_CLIENTS; i++) {
    const client = io(SERVER_URL);

    client.on("connect", () => {
        console.log(`CLient ${i} connected: ${client.id}`);
    });

    client.on("changeColor", ([newColor, date]) => {
        const receivedTime = Date.now();
        const responseTime = receivedTime - date;

        responseTimes.push(responseTime);

        console.log(`Client ${i} : ${responseTime} ms`); //, ${receivedTime} - ${date}`);

        isAll++;

        if (isAll === NUM_CLIENTS) {
            calcAvg();
        }
    })

    clients.push(client);
}

const calcAvg = () => {
    let sum = 0;
    let avg = 0;
    for (let i = 0; i < NUM_CLIENTS; i++) {
        sum += responseTimes[i];
    }

    avg = sum / NUM_CLIENTS;

    console.log(`Average ${avg} ms : ${NUM_CLIENTS} clients`);

    isAll = 0;
}
