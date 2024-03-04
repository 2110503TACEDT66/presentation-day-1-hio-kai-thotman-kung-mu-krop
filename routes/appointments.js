const express = require('express')
const {getAppointments,getAppointment,addAppointment,updateAppointment,deleteAppointment,charge_money}=require('../controllers/appointments');

const router = express.Router({mergeParams:true});

const {protect,authorize}=require('../middleware/auth');

router.route('/').get(protect, getAppointments)
.post(protect, authorize('admin','user'),addAppointment);

router.route('/:id')
.get(protect,getAppointment)
.put(protect,authorize('admin','user'),updateAppointment)
.delete(protect,authorize('admin','user'),deleteAppointment);

router.route('/charge_money/:id').delete(protect,authorize('admin','user'),charge_money);

module.exports=router;