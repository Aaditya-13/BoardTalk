import passport from "passport";

import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth20";

import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from "passport-github2";

import type { VerifyCallback } from "passport-oauth2";

import { env } from "./env.js";

import type { OAuthProfile } from "../modules/auth/types.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/v1/auth/google/callback",
      scope: ["profile", "email"],
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: GoogleProfile,
      done: VerifyCallback
    ) => {
      const user: OAuthProfile = {
        provider: "GOOGLE",
        providerId: profile.id,
        email: profile.emails?.[0]?.value ?? "",
        name: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      };

      done(null, user as unknown as Express.User);
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/v1/auth/github/callback",
      scope: ["user:email"],
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: VerifyCallback
    ) => {
      const user: OAuthProfile = {
        provider: "GITHUB",
        providerId: profile.id,
        email: profile.emails?.[0]?.value ?? "",
        name:
          profile.displayName ??
          profile.username ??
          profile.id,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      };

      done(null, user as unknown as Express.User);
    }
  )
);

export default passport;