const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const stripe = require('stripe')(process.env.SECRET_KEY)
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wcxgg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async () => {
    try {
        client.connect()
        const hotelCollection = client.db('Air-Cnc').collection('Hotels')
        const userCollection = client.db('Air-Cnc').collection('Users')
        const orderCollection = client.db('Air-Cnc').collection('Orders')
        app.post('/api/create-user', async (req, res) => {
            return res.send(await userCollection.insertOne(req.body))
        })
        app.put('/api/save-hotel-order', async (req, res) => {
            const filter = { email: req.body.email, hotelId: req.body.hotelId }
            const options = { upsert: true }
            const updatedDoc = {
                $set: req.body
            }
            const result = await orderCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.get('/api/hotels', async (req, res) => {
            return res.send(await hotelCollection.find(req.query).toArray())
        })
        app.post('/api/add-hotel', async (req, res) => {
            return res.send(await hotelCollection.insertOne(req.body))
        })
        app.get('/api/hotel', async (req, res) => {
            const hotel = await hotelCollection.findOne(req.query)
            if (hotel) {
                return res.send(hotel)
            }
            else {
                return res.send({ error: '404 Not Found' })
            }
        })
        app.post('/api/filter', async (req, res) => {
            let query;
            if (req.body.location === 'all') {
                query = {
                    adults: { $gt: (req.body.adults - 1) },
                    childs: { $gt: (req.body.childs - 1) },
                    babies: { $gt: (req.body.babies - 1) },
                }
            }
            else {
                query = {
                    location: req.body.location,
                    adults: { $gt: (req.body.adults - 1) },
                    childs: { $gt: (req.body.childs - 1) },
                    babies: { $gt: (req.body.babies - 1) },
                }
            }
            const filtered = await hotelCollection.find(query).toArray()
            return res.send(filtered)

        })
        app.post('/createpayment', async (req, res) => {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: req.body.cost * 100,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({ clientSecret: paymentIntent.client_secret })
        })
        app.get('/api/my-orders', async (req, res) => {
            const query = { email: req.query.email }
            return res.send(await orderCollection.find(query).toArray())
        })
    }
    finally { }
}
run().catch(console.dir)
