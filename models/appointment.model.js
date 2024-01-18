var config=require('../dbConfig');
const sql= require('msnodesqlv8');

const Appointment = function(appointment){
  this.Patient_ID = appointment.Patient_ID;
  this.Staff_ID = appointment.Staff_ID;
  this.Service_ID = appointment.Service_ID;
  this.Date = appointment.Date;
  this.Start_Hour = appointment.Start_Hour;
  this.End_Hour = appointment.End_Hour;
  this.Payment = appointment.Payment;
  this.Room_ID = appointment.Room_ID;
  this.Status = appointment.Status;
};

Appointment.create = (newAppointment, result) => {
  sql.query(config, "INSERT INTO Appointment ( Patient_ID, Staff_ID, Service_ID, Date, Start_Hour, End_Hour, Payment, Room_ID, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [ newAppointment.Patient_ID, newAppointment.Staff_ID, newAppointment.Service_ID, newAppointment.Date, newAppointment.Start_Hour, newAppointment.End_Hour, newAppointment.Payment, newAppointment.Room_ID, newAppointment.Status],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        return;
      }
      console.log("Created appointment: ", { id: res.insertId, ...newAppointment });
    }
  );
};

module.exports = Appointment;