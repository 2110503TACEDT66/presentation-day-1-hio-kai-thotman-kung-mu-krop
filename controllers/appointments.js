const Appointment = require('../models/Appointment');
const Dentist = require('../models/Dentist');
const User = require('../models/User');
//@desc Get all appointments
//@route GET /api/v1/appointments
//@access Private
exports.getAppointments=async (req,res,next)=>{
    let query;
    //General users can see only their appointments!
    if(req.user.role !== 'admin'){
        query=Appointment.find({user:req.user.id}).populate({
            path:'dentist',
            select:'name province tel'
        });
    }else { //if you are an admin, you can see all appointments
        if(req.params.dentistId){
            console.log(req.params.dentistId);
            query = Appointment.find({ dentist: req.params.dentistId}).populate({
                path:'dentist',
                select:'name province tel'
            })
        }else{
            query = Appointment.find().populate({
                path:'dentist',
                select:'name province tel'
            });
        }
    }
    try {
        const appointments=await query;

        res.status(200).json({
            success:true,
            count: appointments.length,
            data:appointments
        });

    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success:false,
            message:"Cannot find Appointment"
        });
        
    }
}

//@desc Get single appointment
//@route GET /api/v1/appointments/:id
//@access Public
exports.getAppointment=async (req,res,next)=>{
    try {
        const appointment=await Appointment.findById(req.params.id).populate({
            path : 'dentist',
            select: 'name description tel'
        });

        if(!appointment){
            return res.status(404).json({success:false,
            message:`No appointment with the id of ${req.params.id}`})
        }

        res.status(200).json({
            success:true,
            data: appointment
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false,
        message:"Cannot find Appointment"});
    }
}

//@desc Add appointment
//@route POST /api/v1/Dentists/:DentistId/appointment
//@access Private

exports.addAppointment=async (req,res,next)=>{
    try {
        req.body.dentist=req.params.dentistId;

        const dentist= await Dentist.findById(req.params.dentistId);

        if(!dentist){
            return res.status(404).json({success:false,
            message:`No Dentist with the id of ${req.params.dentistId}`})
        }

        //add user Id to req.body
        req.body.user=req.user.id;

        //Check for existed appointment
        const existedAppointment=await Appointment.find({user:req.user.id});

        //If the user is nit an admin, they can only create 3 appointment.
        if(existedAppointment.length >=1 && req.user.role !== 'admin'){
            return res.status(400).json({success:false,message:`The user with ID ${req.user.id} has already made an appointment`});
        }

        const appointment = await Appointment.create(req.body);
        
        res.status(200).json({
            success:true,
            data:appointment
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({success:false,
        message:"Cannot create Appointment"});
        
    }
}

//@desc Update appointment
//@route PUT /api/v1/appointments/:id
//@access Private

exports.updateAppointment=async (req,res,next)=>{
    try {
        
        let appointment = await Appointment.findById(req.params.id);

        if(!appointment){
            return res.status(404).json({success:false,
                message:`No appointment with the id of ${req.params.id}`});
            }

            //Make sure user is the appointment owner
        if(appointment.user.toString()!== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success:false,
            message:`User ${req.user.id} is not authorized to update this bootcamp`})
        }

                appointment = await Appointment.findByIdAndUpdate(req.params.id,req.body,{
                    new:true,
                    runValidators:true
            });

            res.status(200).json({
                success:true,
                data: appointment
            });
    } catch (error) {
        console.log(error);

        return res.status(500).json({success:false,
        message:"Cannot update Appointment"});
    }
};

//@desc Delete appointment
//@route DELETE /api/v1/appointments/:id
//@access Private

exports.deleteAppointment=async(req,res,next)=>{
    try {
        const appointment= await Appointment.findById(req.params.id);

        if(!appointment){
            return res.status(401).json({success:false,
            message:`No appointment with the if of ${req.params.id}`});
        }
        //Make sure user is the appointment owner
        if(appointment.user.toString()!== req.user.id && req.user.role !== 'admin'){
            return res.status(400).json({success:false,
            message:`User ${req.user.id} is not authorized to delete this bootcamp`})
        }

        await appointment.deleteOne();

        res.status(200).json({
            success:true,
            data: {}
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false,
        message:"Cannot delete Appointment"});
    }
};

exports.charge_money = async (req, res, next) => {
    try {
        // Find the appointment
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: `No appointment with the id of ${req.params.id}` });
        }

        // Get the dentist's cost
        const dentist = await Dentist.findById(appointment.dentist);
        if (!dentist) {
            return res.status(404).json({ success: false, message: `No dentist found for the appointment` });
        }
        const dentistCost = dentist.medical_fee;

        // Find the user
        const user = await User.findByIdAndUpdate(appointment.user);
        if (!user) {
            return res.status(404).json({ success: false, message: `No user found with id ${req.user.id}` });
        }

        // Check if user has sufficient balance
        if (user.balance < dentistCost) {
            console.log(user.balance);
            console.log(dentistCost);
            return res.status(400).json({ success: false, message: `Insufficient balance. Please top up your account.` });
        }

        // Deduct the dentist's cost from user's balance
        const updatedUser = await User.findByIdAndUpdate(
            appointment.user,
            { $inc: { balance: -dentistCost } },
            { new: true }
        );
        
        // await user.save();

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: `No user found with id ${appointment.user}` });
        }

        await appointment.deleteOne();
        
        res.status(200).json({ success: true, message: `Successfully charged ${dentistCost} from user's balance` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};