const startAtStr = "2026-06-01T13:30:00.000Z";
const timeString = new Date(startAtStr).toLocaleTimeString("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit"
});
const hour = parseInt(timeString.split(":")[0], 10);
console.log("timeString:", timeString, "hour:", hour);
