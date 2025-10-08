const express = require("express");
const router = express.Router();

const devicesRoute = require("./devices");
const sensorDataRoute = require("./sensorData");
const userRoute = require("./users");
const authRoute = require("./auth");

router.use("/devices", devicesRoute);
router.use("/sensor-data", sensorDataRoute);
router.use("/users", userRoute);
router.use("/auth", authRoute);

module.exports = router;
