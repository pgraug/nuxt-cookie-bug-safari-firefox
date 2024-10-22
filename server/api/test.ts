export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  setCookie(event, "testCookie", body.cookieValue);

  return { success: true };
});
