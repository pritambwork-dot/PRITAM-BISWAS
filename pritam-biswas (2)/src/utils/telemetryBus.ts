export type TelemetryEvent =
  | { type: "SECTION_SCROLL"; section: string; percentage: number; direction: "up" | "down" }
  | { type: "YUKON_TAB_SWITCH"; tab: "copilot" | "spatial" | "stack" }
  | { type: "YUKON_COPILOT_CHAT"; query: string }
  | { type: "EXPERIENCE_HOVER"; company: string }
  | { type: "EXPERIENCE_METRIC_CLICK"; company: string; metric: string }
  | { type: "ATS_RESUME_ANALYZER_CLICK" }
  | { type: "RESUME_DOWNLOAD_CLICK" }
  | { type: "CONTACT_INPUT_FOCUS"; field: string }
  | { type: "CONTACT_SUBMIT_SUCCESS"; name: string }
  | { type: "TELEMETRY_EASTER_EGG"; secret: string };

type TelemetryCallback = (event: TelemetryEvent) => void;

class TelemetryPublisher {
  private listeners: Set<TelemetryCallback> = new Set();

  /**
   * Subscribe to the telemetry stream. Returns an unsubscribe function.
   */
  subscribe(callback: TelemetryCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Publish a new telemetry event to all subscribers.
   */
  publish(event: TelemetryEvent): void {
    // Run async to prevent blocking standard UI threads/event cycles
    setTimeout(() => {
      this.listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (e) {
          console.error("Telemetry subscriber crashed gracefully:", e);
        }
      });
    }, 0);
  }
}

export const telemetryBus = new TelemetryPublisher();
