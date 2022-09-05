import express, { Router } from 'express';
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
      time: dayjs().format('HH:mm:ss')
    }

    const schema = Joi.object({
      name: Joi.string().required()
    })

   const { error } = schema.validate({ name: body.name});
   
   if(!error){
        const isRegistred = await database.collection("participants").findOne({name: participant.name})
        if(isRegistred!==null){
          res.sendStatus(409);
          return;
        }
        const insertedUser =  await database.collection("participants").insertOne(participant);
        const insertedMessage =  await database.collection("messages").insertOne(loginMessage);
        res.sendStatus(201);
    }
  return res.status(422);
})

server.get("/participants", async (req,res) =>{
    try{
      const getUser =  await database.collection("participants").find({}).toArray();
      res.send(getUser);
    }catch(error){
      res.send("Erro ao retornar lista de participantes");
  }
});

server.post("/messages", async(req,res) => {
 
  const {to, text, type} = req.body;
  const from = req.headers.user;
  const time = dayjs().format('HH:mm:ss')
  const user = await database.collection("participants").findOne({name: from})

  const message={
    from: from,
    to: to,
    text: text,
    type: type,
    time: time
  }

  const messageSchema = Joi.object({
      from: Joi.string().required(),
      to: Joi.string().required(),
      text: Joi.string().required(),
      type: Joi.string().required(),
      time: Joi.string().required()
  });

  const validation = messageSchema.validate(message)

  if(validation.error){
    console.log("Erro de validação");
    res.status(422).send("Erro de validação");
    return;
  }
 
try{
  if(!user){
    res.status(422).send("Participante não cadastrado");
    console.log("Participante não cadastradoo");
    return;
  }
  await database.collection("messages").insertOne(message)
  return res.sendStatus(201);
}catch{ (err)
  return res.sendStatus(422);
}
});

server.get("/messages", async (req,res) =>{
  const limit = req.query.limit;
  const user = req.headers.user;
  let messages = await database.collection("messages").find({}).toArray();

  messages = messages.filter(available => available.type === "message" || available.type==="status" || available.to === "user" || available.from==="user")
  messages = messages.slice(-limit);
  messages.reverse();
  messages.reverse();
  res.send(messages);
})

server.post("/status", async (req,res) => {
  const user = req.headers.user;
  try{
    const checkUser = await database.collection("participants").findOne({name: user})
    if(!checkUser){
      res.status(404).send("Participante não cadastrado");
      console.log("Participante não cadastradoo");
      return;
    }
    await database.collection("participants").updateOne(
      {name: user},
      {$set: {lastStatus: Date.now()}}
    );
    res.sendStatus(200);
  }catch{
    res.send("Erro ao buscar participante");
  }
});

setInterval(async() => {
  const getUsers =  await database.collection("participants").find({}).toArray();

  getUsers.map(async (user) =>{
    if(Date.now() - user.lastStatus > 10000){
      const exitMessage ={
      from: user.name,
      to: "Todos",
      text: "sai da sala...",
      type: "status",
      time: dayjs().format('HH:mm:ss')
      }
      await database.collection("participants").deleteOne({name:user.name});
      await database.collection("messages").insertOne(exitMessage)
    }
  })
}, 15000);

server.listen(5000, () => console.log("Rodando"))