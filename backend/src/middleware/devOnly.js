module.exports = function devOnly(req, res, next) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ ok: false, message: "Not found" });
  }
  next();
};