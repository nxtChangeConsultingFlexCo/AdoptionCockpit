import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verhindert Fehlerkennung des Workspace-Roots durch ein
  // package-lock.json im Windows-Benutzerverzeichnis.
  outputFileTracingRoot: path.join(__dirname),
  // Wir pflegen CLAUDE.md selbst; Next soll AGENTS.md/CLAUDE.md nicht
  // bei jedem `next dev`-Start neu generieren.
  agentRules: false,
};

export default nextConfig;
