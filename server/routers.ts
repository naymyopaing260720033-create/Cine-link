import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createMyanmarMovieContent,
  deleteMyanmarMovieContent,
  getMyanmarMovieContentByTmdbId,
  listMyanmarMovieContents,
  updateMyanmarMovieContent,
  setMyanmarMovieImage,
} from "./db";
import {
  MOVIE_REQUEST_STATUSES,
  MovieRequestDeliveryError,
  MovieRequestInputError,
  deleteMovieRequest,
  listMovieRequests,
  submitMovieRequest,
  updateMovieRequest,
} from "./movieRequests";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const optionalMyanmarCopy = z
  .string()
  .trim()
  .max(10_000)
  .nullable()
  .optional();

const contentInput = z.object({
  tmdbId: z.number().int().positive().max(9_999_999),
  title: optionalMyanmarCopy,
  tagline: optionalMyanmarCopy,
  synopsis: optionalMyanmarCopy,
});

function hasEditorialCopy(input: z.infer<typeof contentInput>) {
  return Boolean(input.title?.trim() || input.tagline?.trim() || input.synopsis?.trim());
}

function normalizeCopy(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

const MAX_EDITORIAL_IMAGE_BYTES = 5 * 1024 * 1024;
const imageInput = z.object({
  id: z.number().int().positive(),
  kind: z.enum(["poster", "backdrop"]),
  // Base64 increases the original byte size, so this allows a 5 MB input file.
  dataUrl: z.string().max(7_000_000),
});

const movieRequestStatusInput = z.enum(MOVIE_REQUEST_STATUSES);
const movieRequestSubmissionInput = z.object({
  title: z.string().trim().min(2).max(180),
  /** Hidden browser-only honeypot; values are accepted without sending a message. */
  website: z.string().max(256).optional(),
});

function decodeEditorialImage(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataUrl);
  if (!match) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use a JPG, PNG, or WebP image file.",
    });
  }

  const [, mimeType, base64Data] = match;
  const bytes = Buffer.from(base64Data, "base64");
  if (!bytes.length || bytes.length > MAX_EDITORIAL_IMAGE_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Image files must be smaller than 5 MB.",
    });
  }

  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  return { bytes, mimeType, extension };
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  myanmarMovieContent: router({
    /** Public detail pages read a single override, then fall back to static/TMDB content. */
    byTmdbId: publicProcedure
      .input(z.object({ tmdbId: z.number().int().positive() }))
      .query(({ input }) => getMyanmarMovieContentByTmdbId(input.tmdbId)),

    /** The following procedures are available only to users promoted to admin. */
    list: adminProcedure.query(() => listMyanmarMovieContents()),

    create: adminProcedure.input(contentInput).mutation(async ({ input, ctx }) => {
      if (!hasEditorialCopy(input)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Add at least one Myanmar content field." });
      }
      await createMyanmarMovieContent({
        tmdbId: input.tmdbId,
        title: normalizeCopy(input.title),
        tagline: normalizeCopy(input.tagline),
        synopsis: normalizeCopy(input.synopsis),
        editorOpenId: ctx.user.openId,
      });
      return { success: true } as const;
    }),

    update: adminProcedure
      .input(contentInput.extend({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        if (!hasEditorialCopy(input)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Add at least one Myanmar content field." });
        }
        await updateMyanmarMovieContent(input.id, {
          tmdbId: input.tmdbId,
          title: normalizeCopy(input.title),
          tagline: normalizeCopy(input.tagline),
          synopsis: normalizeCopy(input.synopsis),
        });
        return { success: true } as const;
      }),

    remove: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteMyanmarMovieContent(input.id);
        return { success: true } as const;
      }),

    uploadImage: adminProcedure.input(imageInput).mutation(async ({ input, ctx }) => {
      const { bytes, mimeType, extension } = decodeEditorialImage(input.dataUrl);
      const filePath = `cinelink/editorial/${ctx.user.id}/${input.id}/${input.kind}.${extension}`;
      const storedImage = await storagePut(filePath, bytes, mimeType);
      await setMyanmarMovieImage(input.id, input.kind, {
        storageKey: storedImage.key,
        url: storedImage.url,
      });
      return { success: true, url: storedImage.url } as const;
    }),

    removeImage: adminProcedure
      .input(z.object({ id: z.number().int().positive(), kind: z.enum(["poster", "backdrop"]) }))
      .mutation(async ({ input }) => {
        await setMyanmarMovieImage(input.id, input.kind, null);
        return { success: true } as const;
      }),
  }),
  movieRequests: router({
    /** Public and anonymous: only a movie name is accepted. */
    submit: publicProcedure.input(movieRequestSubmissionInput).mutation(async ({ input }) => {
      if (input.website) return { duplicate: false, accepted: true } as const;
      try {
        const result = await submitMovieRequest(input.title);
        return { duplicate: result.duplicate, accepted: true } as const;
      } catch (error) {
        if (error instanceof MovieRequestInputError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("[Movie Requests] Submission failed", error);
        const message = error instanceof MovieRequestDeliveryError
          ? "Your request could not be sent right now. Please try again later."
          : "Your request could not be saved right now. Please try again later.";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),
    list: adminProcedure
      .input(z.object({ status: movieRequestStatusInput.optional() }).optional())
      .query(({ input }) => listMovieRequests(input?.status)),
    update: adminProcedure
      .input(
        z.object({
          id: z.string().min(1),
          status: movieRequestStatusInput,
          adminNote: z.string().trim().max(500).nullable().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await updateMovieRequest(input.id, input);
        } catch (error) {
          if (error instanceof MovieRequestInputError) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
          }
          throw error;
        }
      }),
    remove: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
      try {
        await deleteMovieRequest(input.id);
        return { success: true } as const;
      } catch (error) {
        if (error instanceof MovieRequestInputError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw error;
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
