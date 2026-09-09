/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["@sundman/prisma"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.robinsundman.se" }],
        destination: "https://robinsundman.se/:path*",
        permanent: true,
      },
      {
        source: "/join/:code",
        destination: "/quiz/join/:code",
        permanent: false,
      },
      {
        source: "/play/:sessionId",
        destination: "/quiz/play/:sessionId",
        permanent: false,
      },
      {
        source: "/leaderboard",
        destination: "/quiz/leaderboard",
        permanent: false,
      },
      {
        source: "/leaderboard/:sessionId",
        destination: "/quiz/leaderboard/:sessionId",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/quiz/admin",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/quiz/admin/:path*",
        permanent: false,
      },
    ];
  },
};

export default config;
