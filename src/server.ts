import app from "./app";

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
  console.log(`Swagger UI at http://0.0.0.0:${PORT}/api-docs`);
  console.log(`Health check at http://0.0.0.0:${PORT}/health`);
});
