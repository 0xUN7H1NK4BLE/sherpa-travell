export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    const available = !!context;
    if (context) {
      context.getExtension("WEBGL_lose_context")?.loseContext();
    }
    return available;
  } catch {
    return false;
  }
}
