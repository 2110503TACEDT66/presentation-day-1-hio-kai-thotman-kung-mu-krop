const User = require('../models/User');

//@desc register user
//@route POST /api/v1/auth/register
//@access Public
exports.register=async (req,res,next)=>{
    try {
        const {name,telephone_number, email, password, role} = req.body;

        //create user to the database
        const user = await User.create({
            name,
            telephone_number,
            email,
            password,
            role
        });

        //Create token
        //const token=user.getSignedJwtToken();
        //res.status(200).json({success:true,token});
        sendTokenResponse(user,200,res);
    } catch (err) {
        res.status(400).json({success:false});
        console.log(err.stack);
    }
}

//@desc Login user
//@route POST /api/v1/auth/login
//@access Public
exports.login=async (req,res,next)=>{
    try{
    const {email,password} = req.body;

    //Validate email & password
    if(!email || !password){
        return res.status(400).json({success:false,
        msg:'Please provide an email and password'});
    }

    //Check for user
    const user = await User.findOne({email}).select('+password');
    if(!user){
        return res.status(400).json({success:false,
            msg:'Invalid credentials'});
    }

    //Check if password matches
    const isMatch = await user.matchPassword(password);

    if(!isMatch){
        return res.status(401).json({success:false,
        msg:'Invalid credentials'});
    }

    //Create token
    //const token=user.getSignedJwtToken();
    //res.status(200).json({success:true,token});
    sendTokenResponse(user,200,res);
    }catch(err){
        return res.status(401).json({success:false,
            msg:'Cannot convert email or password to string'})
    }
}

//Get token from model, create cookie and send response
const sendTokenResponse=(user, statusCode, res)=>{
    //Create token
    const token=user.getSignedJwtToken();

    const options = {
        expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly: true
    };

    if(process.env.NODE_ENV==='production'){
        options.secure=true;
    }
    res.status(statusCode).cookie('token',token,options).json({
        success: true,
        token
    })
}

//@desc Get current Logged in user
//@route POST /api/v1/auth/me
//@access Private
exports.getMe=async(req,res,next)=>{
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        data:user
    });
};

//@desc Log user out / clear cookie
//@route GET /api/v1/auth/logout
//@access Private
exports.logout=async(req,res,next)=>{
    res.cookie('token','none',{
        expires: new Date(Date.now() + 10*1000),
        httpOnly:true
    });

    res.status(200).json({
        success:true,
        data:{}
    });
};

//@desc Update user
//@route POST /api/v1/auth/:id
//@access Private
// exports.Update=async(req,res,next)=>{
//     try {
        
//         //let user = await User.findById(req.user.id);
//         const user = await User.findById(req.user.id);


//         if(!user){
//             return res.status(404).json({success:false,
//                 message:`No user with the id of ${req.user.id}`});
//             }
        
           
//             //Make sure user is the user owner
//         if(user._id.toString()!== req.user.id && req.user.role !== 'admin'){ // user._id.toString()!== req.user.id
//             return res.status(401).json({success:false,
//             message:`User ${req.user.id} is not authorized to update this user`})
//         }
      
//                 user = await User.findByIdAndUpdate(req.user.id,req.body,{
//                     new:true,
//                     runValidators:true
//             });
            
//             res.status(200).json({
//                 success:true,
//                 data: User
//             });
//     } catch (error) {
//         console.log(error);

//         return res.status(500).json({success:false,
//         message:"Cannot update User"});
//     }
// }

exports.Update=async(req,res,next)=>{
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body,{
            new:true,
            runValidators:true
        })
        if(!user)
            return res.status(400).json({success:false});
            res.status(200).json({success:true,data: user});
    } catch (error) {
        res.status(400).json({success:false});
    }
}

