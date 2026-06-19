import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

const f = createUploadthing();

/**
 * UploadThing file router. One endpoint: `eventPoster`.
 *
 * Auth is enforced in the middleware (runs on the server before the upload is
 * granted): only ADMIN / SUPER_ADMIN sessions may upload. The browser never
 * touches our storage credentials — UploadThing brokers the signed upload.
 */
export const ourFileRouter = {
  eventPoster: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();
      const user = session?.user;
      if (
        !user ||
        (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)
      ) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      // The return value is sent to the client `onClientUploadComplete` callback.
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
