const axios = require("axios");

const LOG_API_URL = "http://20.244.56.144/evaluation-service/logs";
const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJkYXdvb2RhbmFzMTIyMUBnbWFpbC5jb20iLCJleHAiOjE3NTcxNTQxMjIsImlhdCI6MTc1NzE1MzIyMiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjUwODIzMjQwLWJiODYtNDk2MC04MDE2LTg0OGQ3ZmY4Mjg4YyIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImRhd29vZCBhbmFzIiwic3ViIjoiNmZmNjkxYTUtNTc5YS00ZDYyLWFlZjEtNTFhZmRhZjQ5ZmI4In0sImVtYWlsIjoiZGF3b29kYW5hczEyMjFAZ21haWwuY29tIiwibmFtZSI6ImRhd29vZCBhbmFzIiwicm9sbE5vIjoiMjI3MDFhMzEwMyIsImFjY2Vzc0NvZGUiOiJ5elp2Z0ciLCJjbGllbnRJRCI6IjZmZjY5MWE1LTU3OWEtNGQ2Mi1hZWYxLTUxYWZkYWY0OWZiOCIsImNsaWVudFNlY3JldCI6IlNZUFJYYWhBaGRZcU1TZFMifQ.IFTFR5WR-DQYkMEe8kvZF8GoQSEE7EvWQkDHbsrIoWA";

const ALLOWED_STACK = "backend";
const ALLOWED_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const ALLOWED_PACKAGES = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "auth",
  "config",
  "middleware",
  "utils",
]);

const Log = async (stack, level, pkg, message) => {
  if (
    stack !== ALLOWED_STACK ||
    !ALLOWED_LEVELS.has(level) ||
    !ALLOWED_PACKAGES.has(pkg)
  ) {
    console.error("--> Invalid log parameters provided. Aborting log call.");
    console.error(
      `--> Attempted: { stack: ${stack}, level: ${level}, package: ${pkg} }`
    );
    return;
  }

  try {
    const response = await axios.post(
      LOG_API_URL,
      {
        stack,
        level,
        package: pkg,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    console.log(`Log sent successfully. LogID: ${response.data.logID}`);
  } catch (error) {
    console.error("--> FAILED TO SEND LOG TO EXTERNAL SERVICE <--");

    if (error.response) {
      console.error(
        "--> API Error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error(
        `--> Fallback Log: [${level.toUpperCase()}] [${pkg}] ${message}`
      );
    }
  }
};

module.exports = Log;
