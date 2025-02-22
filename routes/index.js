var express = require('express');
var router = express.Router();
const userModel = require("../routes/users");
const postModel = require("../routes/post");
const passport = require('passport');
const localStrategy = require("passport-local");
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
  res.render('index',{nav:false});
});
router.get('/profile',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({
    username:req.session.passport.user
  }).populate("posts");
  console.log(user);
  res.render("profile",{user,nav:true});
});

router.get('/show/posts',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({
    username:req.session.passport.user
  }).populate("posts");
  res.render("show",{user,nav:true});
});

router.get('/feed',isLoggedIn, async function(req, res, next) {
  const posts = await postModel.find()
  .populate("user")
  res.render("feed",{posts,nav:true});
});

router.get('/add',isLoggedIn, async function(req, res, next) {
  res.render("add",{nav:true})
});

router.post('/createpost',isLoggedIn,upload.single('postimage'),async function(req, res, next) {
  // res.render("add",{nav:true})
  const user = await userModel.findOne({
    username:req.session.passport.user
  })
  const post = await postModel.create({
    user:user._id,
    title:req.body.title,
    description:req.body.description,
    image:req.file.filename
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile")
});



router.post('/fileupload',isLoggedIn,upload.single("image"), async function(req, res, next) {
  const user = await userModel.findOne({
    username:req.session.passport.user
  })
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});




router.get('/register', function(req, res, next) {
  res.render('register',{nav:false});
});

router.post("/register",function(req,res,next){
  const {username,fullname,email,contact} = req.body;
  const userData = new userModel({
    username,
    fullname,
    email,
    contact
  })
  userModel.register(userData,req.body.password).
  then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })
})

router.post("/login",passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/"
}),function(req,res,next){

});

router.get("/logout",function(req,res,next){
  req.logOut(function(err){
    if(err) {return next(err);}
    res.redirect("/");
  })
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/")
}

module.exports = router;
