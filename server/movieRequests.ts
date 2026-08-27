import { MongoClient, ObjectId, type Collection } from "mongodb";

export const MOVIE_REQUEST_STATUSES = ["new", "searching", "available", "declined"] as const;
export type MovieRequestStatus = (typeof MOVIE_REQUEST_STATUSES)[number];
export const MOVIE_REQUEST_TYPES = ["movie", "series"] as const;
export type MovieRequestType = (typeof MOVIE_REQUEST_TYPES)[number];

type NotificationStatus = "sent" | "failed";

type MovieRequestDocument = {
  _id?: ObjectId;
  requestedTitle: string;
  normalizedTitle: string;
  /** Optional for compatibility with movie-only documents created before request types existed. */
  requestType?: MovieRequestType;
  description?: string | null;
  status: MovieRequestStatus;
  requestCount: number;
  adminNote: string | null;
  notificationStatus: NotificationStatus;
  telegramNotificationSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastRequestedAt: Date;
};

export type MovieRequestRecord = Omit<MovieRequestDocument, "_id" | "requestType" | "description"> & {
  id: string;
  requestType: MovieRequestType;
  description: string | null;
};

export class MovieRequestInputError extends Error {}
export class MovieRequestDeliveryError extends Error {}

let mongoClient: MongoClient | null = null;
let indexesReady = false;

function requiredEnvironment(name: "MONGODB_URI" | "TELEGRAM_BOT_TOKEN" | "TELEGRAM_REQUESTS_CHANNEL_ID") {
  const value = process.env[name]?.trim();
  if (!value) throw new MovieRequestDeliveryError(`${name} is not configured.`);
  return value;
}

export function cleanMovieRequestTitle(value: string) {
  const title = value.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  if (title.length < 2) throw new MovieRequestInputError("Enter a movie name with at least 2 characters.");
  if (title.length > 180) throw new MovieRequestInputError("Movie names must be 180 characters or fewer.");
  return title;
}

export function normalizeMovieRequestTitle(value: string) {
  return cleanMovieRequestTitle(value)
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^\w\u1000-\u109f]+/g, " ")
    .trim();
}

export function cleanMovieRequestDescription(value: string | null | undefined) {
  const description = value?.replace(/\s+/g, " ").replace(/[\u0000-\u001F\u007F]/g, "").trim() || null;
  if (description && description.length > 600) {
    throw new MovieRequestInputError("Request details must be 600 characters or fewer.");
  }
  return description;
}

export function formatMovieRequestTelegramMessage(
  requestType: MovieRequestType,
  title: string,
  description: string | null,
  requestCount: number,
  receivedAt: Date,
) {
  return [
    `NEW ${requestType === "series" ? "SERIES" : "MOVIE"} REQUEST`,
    "",
    `Title: ${title}`,
    description ? `Details: ${description}` : null,
    `Requests: ${requestCount}`,
    "Source: CineLink website",
    `Received: ${receivedAt.toISOString()}`,
  ].filter((line): line is string => line !== null).join("\n");
}

async function getMovieRequestCollection(): Promise<Collection<MovieRequestDocument>> {
  const uri = requiredEnvironment("MONGODB_URI");
  if (!mongoClient) {
    mongoClient = new MongoClient(uri, {
      appName: "CineLinkMovieRequests",
      serverSelectionTimeoutMS: 6_000,
    });
  }

  const databaseName = process.env.MONGODB_DB_NAME?.trim() || "cinelink";
  const collection = mongoClient.db(databaseName).collection<MovieRequestDocument>("movie_requests");
  if (!indexesReady) {
    await collection.createIndex({ normalizedTitle: 1, status: 1 });
    await collection.createIndex({ requestType: 1, normalizedTitle: 1, status: 1 });
    await collection.createIndex({ lastRequestedAt: -1 });
    await collection.createIndex({ requestCount: -1, lastRequestedAt: -1 });
    indexesReady = true;
  }
  return collection;
}

function toRecord(document: MovieRequestDocument & { _id: ObjectId }): MovieRequestRecord {
  const { _id, requestType = "movie", description = null, ...request } = document;
  return { id: _id.toHexString(), ...request, requestType, description };
}

async function sendNewRequestNotification(
  requestType: MovieRequestType,
  title: string,
  description: string | null,
  requestCount: number,
  receivedAt: Date,
) {
  const token = requiredEnvironment("TELEGRAM_BOT_TOKEN");
  const chatId = requiredEnvironment("TELEGRAM_REQUESTS_CHANNEL_ID");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatMovieRequestTelegramMessage(requestType, title, description, requestCount, receivedAt),
      disable_web_page_preview: true,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
  if (!response.ok || !payload?.ok) {
    throw new MovieRequestDeliveryError("The request notification could not be delivered.");
  }
}

export async function submitMovieRequest(
  rawTitle: string,
  requestType: MovieRequestType = "movie",
  rawDescription?: string | null,
) {
  const requestedTitle = cleanMovieRequestTitle(rawTitle);
  const normalizedTitle = normalizeMovieRequestTitle(requestedTitle);
  const description = cleanMovieRequestDescription(rawDescription);
  const collection = await getMovieRequestCollection();
  const now = new Date();

  const existing = await collection.findOneAndUpdate(
    requestType === "movie"
      ? {
          normalizedTitle,
          status: { $in: ["new", "searching"] },
          $or: [{ requestType: "movie" }, { requestType: { $exists: false } }],
        }
      : { normalizedTitle, requestType, status: { $in: ["new", "searching"] } },
    { $inc: { requestCount: 1 }, $set: { updatedAt: now, lastRequestedAt: now } },
    { returnDocument: "after" },
  );

  if (existing) {
    return { request: toRecord(existing), duplicate: true, notificationSent: false };
  }

  const newRequest: MovieRequestDocument = {
    requestedTitle,
    normalizedTitle,
    requestType,
    description,
    status: "new",
    requestCount: 1,
    adminNote: null,
    notificationStatus: "failed",
    telegramNotificationSentAt: null,
    createdAt: now,
    updatedAt: now,
    lastRequestedAt: now,
  };
  const inserted = await collection.insertOne(newRequest);
  const request = { ...newRequest, _id: inserted.insertedId };

  try {
    await sendNewRequestNotification(requestType, requestedTitle, description, 1, now);
    await collection.updateOne(
      { _id: inserted.insertedId },
      { $set: { notificationStatus: "sent", telegramNotificationSentAt: new Date(), updatedAt: new Date() } },
    );
    return { request: toRecord({ ...request, notificationStatus: "sent", telegramNotificationSentAt: new Date() }), duplicate: false, notificationSent: true };
  } catch (error) {
    if (error instanceof MovieRequestDeliveryError) throw error;
    throw new MovieRequestDeliveryError("The request notification could not be delivered.");
  }
}

export async function listMovieRequests(status?: MovieRequestStatus) {
  const collection = await getMovieRequestCollection();
  const filter = status ? { status } : {};
  const records = await collection.find(filter).sort({ lastRequestedAt: -1 }).toArray();
  return records.map(toRecord);
}

export async function updateMovieRequest(
  id: string,
  input: { status: MovieRequestStatus; adminNote?: string | null },
) {
  if (!ObjectId.isValid(id)) throw new MovieRequestInputError("Invalid request identifier.");
  const collection = await getMovieRequestCollection();
  const adminNote = input.adminNote?.replace(/\s+/g, " ").trim() || null;
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status: input.status, adminNote, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) throw new MovieRequestInputError("Movie request was not found.");
  return toRecord(result);
}

export async function deleteMovieRequest(id: string) {
  if (!ObjectId.isValid(id)) throw new MovieRequestInputError("Invalid request identifier.");
  const collection = await getMovieRequestCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (!result.deletedCount) throw new MovieRequestInputError("Movie request was not found.");
}
