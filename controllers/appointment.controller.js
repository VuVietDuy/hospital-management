const Appointment = require('../models/appointment.model')

function addOneHour(originalTime) {
    const [hours, minutes] = originalTime.split(':').map(Number);
  
    // Tính toán thời gian mới
    const newHours = (hours + 1) % 24;
    const newTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
    return newTime;
  }

exports.makeApponitment = (req, res) => {
    const user = req.session.user;
    console.log("appointment" , user);
    const data = req.body;

    const appointment = new Appointment({
        Patient_ID: user.Patient_ID,
        Staff_ID: parseInt(data.Staff_ID, 10),
        Service_ID: parseInt(data.Service_ID, 10),
        Date: data.Date,
        Start_Hour: data.Start_Hour,
        End_Hour: addOneHour(data.Start_Hour),
        Payment: data.Payment,
        Room_ID: data.Room_ID,
        Status: "Pending",
    });

    Appointment.create(appointment, (err, result) => {
        if(err) {
            console.log(err);
        }
    });
    res.redirect(`/patientAppointment?service=${appointment.Service_ID}`);
}