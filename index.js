const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.j7l4khx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        //Collections
        const postsCollection = client.db('myVillage').collection('posts');
        const usersCollection = client.db('myVillage').collection('users');

        //Create user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const alreadyExist = await usersCollection.findOne(query);
            if (alreadyExist) {
                return;
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //getUsers by email
        app.get('/users', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        //add post to database
        app.post('/posts', verifyJWT, async (req, res) => {
            const post = req.body;
            const result = await postsCollection.insertOne(post);
            res.send(result);
        })

        //get post api
        app.get('/posts', verifyJWT, async (req, res) => {
            const query = {};
            const posts = await postsCollection.find(query).toArray();
            res.send(posts);
        })

        //Generate a jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' });
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })

    }
    finally {

    }
}
run().catch(err => console.log(err))

app.get('/', async (req, res) => {
    res.send('doctors portal is running');
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})