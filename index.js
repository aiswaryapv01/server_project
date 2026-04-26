const express = require("express")
const mongoose = require('mongoose')
const cors = require("cors")
const StudentModel = require('./models/student')
const app = express()
const axios = require('axios');
app.use(express.json())
app.use(cors())
const bcrypt = require('bcryptjs');
const PORT = process.env.PORT || 5000;

mongoose.connect("mongodb+srv://nehaanil753:pOLAqsKIov7T7a2U@cluster0.k8l9hzx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });


  app.post("/login",(req,res) => {
    const {email,password}= req.body;
    StudentModel.findOne({email: email})
    .then(user =>{
      if(user){
        // Compare the hashed password with the provided password
        bcrypt.compare(password, user.password)
          .then((result) => {
            if(result){
              res.json("Success");
            } else {
              res.json("The password is incorrect");
            }
          })
          .catch((error) => {
            console.error('Error comparing passwords:', error);
            res.status(500).json({ error: 'Internal server error' });
          });
      } else {
        res.json("No record existed");
      }
    })
    .catch((error) => {
      console.error('Error finding user:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  });




app.get('/usersBySkill/:skill', async (req, res) => {
  const { skill } = req.params;
  try {
    const users = await StudentModel.find({ skills: { $in: [new RegExp(skill, 'i')] } });
    res.json(users);
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/updateRating/:userId', async (req, res) => {
  const { userId } = req.params;
  const { rating } = req.body;
  try {
    // Update the user's rating in the database
    const user = await StudentModel.findById(userId);
    if (!user.rating) {
      user.rating = [];
    }
    user.rating.push(rating);

    // Assuming rating is an array of numbers
    await user.save();

    res.json({ message: 'Rating updated successfully', user });
  } 
     catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get("/userDetails/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const userDetails = await StudentModel.findOne({ email });
    if (userDetails) {
      /* const totalRatings = userDetails.ratings.length;
      const averageRating = totalRatings > 0 ? userDetails.ratings.reduce((acc, val) => acc + val, 0) / totalRatings : 0;
      const ratingDistribution = Array.from({ length: 5 }, (_, i) => userDetails.ratings.filter(rating => rating === i + 1).length);*/

      res.json({ userDetails });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/check-email", async (req, res) => {
  const { email } = req.body;
  try {
    const existingStudent = await StudentModel.findOne({ email: email });
    if (existingStudent) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/register', async (req, res) => {
  try {
    const existingStudent = await StudentModel.findOne({ email: req.body.email });
    if (existingStudent) {
      return res.status(400).json({ error: 'Email address is already registered' });
    }
    const hashedPassword = req.body.password;
    const newStudent = await StudentModel.create({ ...req.body, password: hashedPassword });
    res.json({ message: 'Registration successful', student: newStudent });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/updateUser', async (req, res) => {
  try {
    const { email, year, branch, skills } = req.body;
    const updatedUser = await StudentModel.findOneAndUpdate({ email }, { year, branch, skills }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User data updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/usersWithDates', async (req, res) => {                                       //
  try {
    const users = await StudentModel.find({ dates: { $exists: true, $ne: [] } });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users with dates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});          

app.put('/updateDates/:email', async (req, res) => {                                      //dates push
  const { email } = req.params;
  const { dates } = req.body;
  try {
    const user = await StudentModel.findOneAndUpdate(
      { email },
      { dates },
      //{ new: true }
    );
    res.json({ message: 'Dates updated successfully', user });
  } catch (error) {
    console.error('Error updating dates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/updateAccept/:email', async (req, res) => {
  const { email } = req.params;
  const { userToAcceptEmail, date } = req.body;
  try {
    const signedInUser = await StudentModel.findOne({ email });

    if (signedInUser) {
      signedInUser.email2.push(userToAcceptEmail); // Push the user email into the email2 array
      signedInUser.accept = true;
      // Only add the selected date to the dates2 field
      signedInUser.dates2.push(date);
      await signedInUser.save();
    }

    res.json({ message: 'Accept status updated successfully' });
  } catch (error) {
    console.error('Error updating accept status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/getUserName', async (req, res) => {                                             //contact div name
  const { email } = req.query;

  try {
    // Find users with matching email2 field
    const users = await StudentModel.find({ email2: email });
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Users not found' });
    }

    // Return an array of user names
    const contact=  users.map(user => user.contact);
    const names = users.map(user => user.name);
    res.json({ names,contact });
  } catch (error) {
    console.error('Error fetching user names:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//

app.get("/",(req,res)=>{
  res.send("Backend is running");
});



app.listen(PORT, () => {
    console.log("server is running")
})
