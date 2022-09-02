import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import {MongoClient} from 'mongodb'
import dayjs from 'dayjs'
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let database;
const promise = mongoClient.connect();

promise.then(() => {
  
  database = mongoClient.db("bate_papo_UOL");
  console.log(database)
});
promise.catch(err => console.log(err))

server.post("/participants", async  (req,res) =>{
    const body = req.body;

    const participant={
      name: body.name,
      lastStatus: Date.now()
    }

    const loginMessage={
      from: req.body.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
    }
    
    try{

        const insertedUser =  await database.collection("participants").insertOne(participant);
        const insertedMessage =  await database.collection("messages").insertOne(loginMessage);
        console.log(insertedUser)
        console.log(insertedMessage)
        console.log("oi")
        res.status(201);
    }catch(error){
        res.status(500);
        console.log("errou")
    }
})

server.get("/participants", async (req,res) =>{
    try{
      console.log("ola")
      const getUser =  await database.collection("participants").find({}).toArray();
      res.send(getUser);
    }catch(error){
      res.send("Erro ao retornar lista de participantes");
  }
});


//setInterval(async() => {
  //console.log("ola")
//}, 1500);

server.listen(5000, () => console.log("Rodando"))