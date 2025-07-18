const os = require('os');

// Get local IP address
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Handle 404 errors with language-specific messages
function handle404Error(req, res) {
  let errorTitle = "Page not found";
  let errorMessage = "The requested page does not exist.";

  if (req.url.startsWith("/hr")) {
    errorTitle = "Page not found";
    errorMessage = "The requested page does not exist.";
  } else if (req.url.startsWith("/de")) {
    errorTitle = "Seite nicht gefunden";
    errorMessage = "Die angeforderte Seite existiert nicht.";
  }

  // Remove the current invalid page from history
  if (req.session.pagesHistory && req.session.pagesHistory.length > 0) {
    const lastPage = req.session.pagesHistory[req.session.pagesHistory.length - 1];
    if (lastPage === req.originalUrl) {
      req.session.pagesHistory.pop();
    }
  }

  // Set valid back page after removing invalid page
  let validBackPage = null;
  if (req.session.pagesHistory && req.session.pagesHistory.length > 0) {
    validBackPage = req.session.pagesHistory[req.session.pagesHistory.length - 1];
  }

  res.status(404).render("error", {
    error: {
      "error-code": 404,
      "error-title": errorTitle,
      "error-message": errorMessage,
    },
    validBackPage: validBackPage,
  });
}

module.exports = {
  getLocalIPAddress,
  handle404Error
};
