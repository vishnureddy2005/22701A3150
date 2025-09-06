const express = require("express");
const { nanoid } = require("nanoid");
const Log = require("./logger");

const app = express();
const port = 3000;

const urlDatabase = {};

app.use(express.json());

app.use((req, res, next) => {
  Log(
    "backend",
    "info",
    "middleware",
    `Request received: ${req.method} ${req.originalUrl}`
  );
  next();
});

app.post("/shorturls", (req, res) => {
  const { url, validity, shortcode: customShortcode } = req.body;

  if (!url) {
    Log("backend", "warn", "handler", "Create failed: URL is required.");
    return res.status(400).json({ error: "URL is a required field" });
  }

  let shortcode = customShortcode;

  if (shortcode) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(shortcode)) {
      Log(
        "backend",
        "warn",
        "handler",
        `Create failed: Invalid shortcode format for '${shortcode}'.`
      );
      return res.status(422).json({ error: "Invalid shortcode format" });
    }
    if (urlDatabase[shortcode]) {
      Log(
        "backend",
        "error",
        "handler",
        `Create failed: Shortcode '${shortcode}' already in use.`
      );
      return res.status(409).json({ error: "Shortcode is already in use" });
    }
  } else {
    shortcode = nanoid(6);
    while (urlDatabase[shortcode]) {
      shortcode = nanoid(6);
    }
  }

  const validityMinutes = parseInt(validity, 10) || 30;
  const expiry = new Date(Date.now() + validityMinutes * 60 * 1000);

  urlDatabase[shortcode] = {
    originalUrl: url,
    createdAt: new Date().toISOString(),
    expiry: expiry.toISOString(),
    clicks: 0,
    clickDetails: [],
  };

  Log(
    "backend",
    "info",
    "handler",
    `Shortcode '${shortcode}' created for URL: ${url}`
  );
  const shortLink = `http://localhost:${port}/${shortcode}`;
  return res
    .status(201)
    .json({ shortLink, expiry: urlDatabase[shortcode].expiry });
});

app.get("/shorturls/:shortcode", (req, res) => {
  const { shortcode } = req.params;
  const record = urlDatabase[shortcode];

  if (!record) {
    Log(
      "backend",
      "warn",
      "handler",
      `Stats lookup failed: Shortcode '${shortcode}' not found.`
    );
    return res.status(404).json({ error: "Shortcode not found" });
  }

  Log(
    "backend",
    "info",
    "handler",
    `Stats retrieved for shortcode: '${shortcode}'.`
  );
  return res.status(200).json({
    totalClicks: record.clicks,
    originalUrl: record.originalUrl,
    creationDate: record.createdAt,
    expiryDate: record.expiry,
    clickData: record.clickDetails,
  });
});

app.get("/:shortcode", (req, res) => {
  const { shortcode } = req.params;
  const record = urlDatabase[shortcode];

  if (!record) {
    Log(
      "backend",
      "warn",
      "route",
      `Redirect failed: Shortcode '${shortcode}' not found.`
    );
    return res.status(404).json({ error: "Short URL not found" });
  }

  if (new Date() > new Date(record.expiry)) {
    delete urlDatabase[shortcode];
    Log(
      "backend",
      "info",
      "route",
      `Redirect failed: Shortcode '${shortcode}' has expired.`
    );
    return res.status(410).json({ error: "This link has expired" });
  }

  record.clicks++;
  record.clickDetails.push({
    timestamp: new Date().toISOString(),
    referrer: req.get("Referer") || "Direct",
    location: `coarse-location-from-ip:${req.ip}`,
  });

  Log(
    "backend",
    "info",
    "route",
    `Redirecting '${shortcode}' to ${record.originalUrl}`
  );
  return res.redirect(302, record.originalUrl);
});

app.listen(port, () => {
  Log(
    "backend",
    "info",
    "service",
    `Server is running on http://localhost:${port}`
  );
});
