require("dotenv").config();
const express = require('express');
const cors = require('cors');
const admin = require("firebase-admin");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = 3000;

app.use(cors());
app.use(express.json());

const serviceAccount = require("./movie-master-pro-firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fm0wyio.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get("/", (req, res) => {
    res.send("MovieMaster Pro server is running");
});

async function run(){
    try{
        await client.connect();
        const db = client.db("movie_db");
        const moviesCollection = db.collection("movies");
        const usersCollection = db.collection("users");

        // User apis
        app.get("/users", async(req, res) => {
            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const query = { email: email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                res.send({
                    message: "User already exists."
                });
            }
            else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }
        });

        // Movies api
        app.get("/movies", async(req, res) => {
            const cursor = moviesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/top-movies", async(req, res) => {
            const cursor = moviesCollection.find().sort({rating: -1}).limit(5);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/recent-movies", async(req, res) => {
            const cursor = moviesCollection.find().sort({createdAt: -1}).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/movies/:id", async(req, res) => {
            const {id} = req.params;
            const query = {_id: new ObjectId(id)};
            const result = await moviesCollection.findOne(query);
            res.send(result);
        });

        app.get("/rating-greater", async(req, res) => {
            const {rating} = req.query;
            const query = {
                rating: {
                    $gte: Number(rating)
                }
            }
            const cursor = moviesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/rating-less", async(req, res) => {
            const {rating} = req.query;
            const query = {
                rating: {
                    $lte: Number(rating)
                }
            }
            const cursor = moviesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/movie-by-genre", async(req, res) => {
            const genres = req.query.genres ? JSON.parse(req.query.genres) : [];
            const filter = {};
            if(genres.length > 0){
                filter.genre =  {
                    $in: genres
                }
            }
            const cursor = moviesCollection.find(filter);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/my-collection", async(req, res) => {
            const {email} = req.query;
            const query = {};
            if (email) query.addedBy = email;
            const cursor = moviesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post("/movies", async(req, res) => {
            const newMovie = req.body;
            const result = await moviesCollection.insertOne(newMovie);
            res.send(result);
        });

        app.patch("/movies/:id", async(req, res) => {
            const { id } = req.params;
            const updatedMovie = req.body;
            const query = { _id: new ObjectId(id) };
            const update = {
                $set: updatedMovie,
            }
            const result = await moviesCollection.updateOne(query, update);
            res.send(result);
        });

        app.delete("/movies/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await moviesCollection.deleteOne(query);
            res.send(result);
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally{

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`MovieMaster Pro server is running on port ${port}`)
});