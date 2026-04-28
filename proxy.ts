import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    try {
      await auth.protect();
    } catch (err) {
      // auth.protect() throws a Response (redirect to sign-in) for unauthenticated
      // users — always re-throw those. Only swallow real infrastructure errors
      // (Clerk JWKS fetch failure, network blip) so a Clerk outage doesn't crash
      // the edge function and take down public routes along with protected ones.
      if (!(err instanceof Error)) throw err;
      console.error('[proxy] auth.protect() infrastructure error, failing open:', err);
    }
  }
});

export const config = {
  matcher: [
    // Next.js internals と静的ファイルをスキップ
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
