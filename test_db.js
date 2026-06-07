const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:3796/test?replicaSet=testset').then(async () => {
  const db = mongoose.connection.db;
  const events = await db.collection('events').find().sort({createdAt:-1}).limit(1).toArray();
  const event = events[0];
  console.log('Event Name:', event.title);
  const rules = await db.collection('availabilityrules').find({eventId: event._id}).toArray();
  console.log('Rules:', rules.map(r => ({ reason: r.reason, start: r.startTime, end: r.endTime })));
  const slots = await db.collection('bookingslots').find({eventId: event._id}).sort({startAt: 1}).limit(10).toArray();
  console.log('Slots:', slots.map(s => s.startAt));
  process.exit(0);
}).catch(console.error);
