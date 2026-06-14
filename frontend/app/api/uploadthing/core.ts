import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  mediaUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "256MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      console.log("[uploadthing] middleware start", {
        method: req.method,
        url: req.url,
      });
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("[uploadthing] upload complete", {
        name: file.name,
        type: file.type,
        size: file.size,
        key: file.key,
        url: file.ufsUrl,
      });

      return {
        url: file.ufsUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        key: file.key,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
