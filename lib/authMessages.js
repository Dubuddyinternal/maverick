/* What a creator sees for each DuBuddy Auth refusal (its "reason" codes).
   Used by the login page and by the server. */
const SAY = {
  INVALID_CODE: "That code isn't right.",
  TOO_MANY_ATTEMPTS: 'Too many tries. Get a new code.',
  EXPIRED: 'The code expired. Get a new one.',
  REPLACED: 'A newer code was sent. Use the latest one.',
  LIMIT_REACHED: 'Too many requests. Try again in a while.',
  BUDGET_SPENT: "We can't send more codes today. Try again tomorrow.",
  INVALID_IDENTIFIER: 'Check the number. It should be an Indian mobile number.',
  CHANNEL_FAILED: "Couldn't send the code. Try again.",
  NOT_FOUND: 'That code has run out. Get a new one.',
  GUARD_REFUSED: 'Please reload the page and try again.',
  /* set-up problems: the creator can't fix these, so name the cause for the team */
  UNAUTHENTICATED: 'Login is not connected yet (the code service did not accept our id).',
  UNKNOWN_PURPOSE: 'Login is not connected yet (the code service does not know our purpose key).',
  CLIENT_PAUSED: 'Login is paused right now. Please try again later.',
  MEDIUM_NOT_ALLOWED: 'Login is not connected yet (SMS is not allowed for this purpose).',
};

export function sayFor(reason, fallback) {
  return SAY[reason] || fallback || 'Something went wrong' + (reason ? ' (' + reason + ')' : '') + '. Please try again.';
}
