import type { UpdateMeInput } from "./schema";
import type { Logger } from "pino";

export async function getMe(_userId: string, requestLogger: Logger): Promise<void> {
  requestLogger.debug({ userId: _userId }, "Get me service started");
  // TODO: implement profile read.
}

export async function updateMe(
  _userId: string,
  _input: UpdateMeInput,
  requestLogger: Logger
): Promise<void> {
  requestLogger.debug(
    { userId: _userId, input: _input },
    "Update me service started"
  );
  // TODO: implement profile update.
}
