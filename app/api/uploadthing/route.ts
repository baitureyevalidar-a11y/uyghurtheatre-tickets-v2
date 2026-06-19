import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Serves the UploadThing client + handles upload callbacks.
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
