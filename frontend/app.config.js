export default {
  name: "GreenChain",
  slug: "greenchain",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "greenchain",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true
  },
  android: {
    package: "com.greenchain.app",
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "RECORD_AUDIO"
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    }
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Allow GreenChain to use location for tracking shipments."
      }
    ],
    [
      "expo-notifications",
      {}
    ],
    "expo-sqlite",
    "expo-maps"
  ],
  experiments: {
    typedRoutes: true
  }
};
