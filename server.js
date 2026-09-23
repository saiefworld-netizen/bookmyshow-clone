const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bookmyshow";
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

const bookingSchema = new mongoose.Schema({
    movie: String,
    seats: [Number],
    totalAmount: Number,
    createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

const TMDB_API_KEY = process.env.TMDB_API_KEY || "YOUR_TMDB_API_KEY";

app.get('/api/movies', async (req, res) => {
    try {
        const nowPlayingRes = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&region=IN`);
        const nowPlayingData = await nowPlayingRes.json();
        const upcomingRes = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&region=IN`);
        const upcomingData = await upcomingRes.json();

        res.json({
            nowShowing: nowPlayingData.results || [],
            upcoming: upcomingData.results || []
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch movies" });
    }
});

io.on('connection', (socket) => {
    socket.on('bookSeats', async (data) => {
        try {
            const newBooking = new Booking(data);
            await newBooking.save();
            io.emit('seatsBooked', data.seats);
        } catch (error) {
            console.log(error);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
