import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

const token = process.env.UPLOADTHING_TOKEN?.trim();

if (!token) {
  console.error(
    "[uploadthing] UPLOADTHING_TOKEN is missing. Add it to signape/frontend/.env.local"
  );
} else {
  console.log("[uploadthing] route handler ready");
}

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token,
    logLevel: "Debug",
  },
});
