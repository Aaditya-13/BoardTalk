import { authService } from "./src/modules/auth/service.js";

async function run() {
  try {
    const result = await authService.devLogin("Alice");
    console.log("Success:", result.tokens);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
