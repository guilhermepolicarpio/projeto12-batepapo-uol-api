import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import {MongoClient} from 'mongodb'
import dayjs from 'dayjs'
import Joi from "joi"
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let database;
const promise = mongoClient.connect();

promise.then(() => {
  database = mongoClient.db("bate_papo_UOL");
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
        const isRegistred = await database.collection("participants").findOne({name: participant.name})
        if(isRegistred!==null){
          res.sendStatus(409);
          return;
        }
        const insertedUser =  await database.collection("participants").insertOne(participant);
        const insertedMessage =  await database.collection("messages").insertOne(loginMessage);
        res.sendStatus(201);
    }catch(error){
        res.status(422);
        console.log("Erro na entrada do participante")
    }
})

server.get("/participants", async (req,res) =>{
    try{
      
      const getUser =  await database.collection("participants").find({}).toArray();
      res.send(getUser);
      console.log(getUser)
    }catch(error){
      res.send("Erro ao retornar lista de participantes");
  }
});

server.get("/messages", async (req,res) =>{
  const limit = req.query.limit;
  const user = req.headers.user;

  let messages = await database.collection("messages").find({}).toArray();
  messages.reverse();
  messages.reverse();
  res.send(messages);
})

setInterval(async() => {
  const getUsers =  await database.collection("participants").find({}).toArray();

  getUsers.map(async (user) =>{
    if(Date.now() - user.lastStatus > 10000){
      const exitMessage ={
      from: user.name,
      to: "Todos",
      text: "sai da sala...",
      type: "status",
      time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
      }
      await database.collection("participants").deleteOne({name:user.name});
      await database.collection("messages").insertOne(exitMessage)
    }
  })
}, 15000);

server.listen(5000, () => console.log("Rodando"))