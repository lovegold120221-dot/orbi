import type { CapacitorConfig } from "@capacitor/cli";

// Override with CAP_SERVER_URL=http://localhost:3000 for local dev
const PROD_URL = "https://orbit.eburon.ai";
const serverUrl = process.env.CAP_SERVER_URL || PROD_URL;
const isLocal = serverUrl.includes("localhost") || serverUrl.includes("127.0.0.1");

const config: CapacitorConfig = {
  appId: "ai.eburon.orbit.meeting",
  appName: "Orbit Meeting",
  webDir: "out",
  server: {
    url: serverUrl,
    cleartext: isLocal,
    allowNavigation: [
      "*.livekit.cloud",
      "*.googleapis.com",
      "*.supabase.co",
    ],
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
      androidSplashResourceName: "splash",
    },
  },
};

export default config;
