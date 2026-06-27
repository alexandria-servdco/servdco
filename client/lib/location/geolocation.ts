export type GeolocationErrorCode =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unknown";

export class GeolocationError extends Error {
  code: GeolocationErrorCode;

  constructor(code: GeolocationErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "GeolocationError";
  }
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 60_000,
};

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function getCurrentPosition(
  options?: PositionOptions,
): Promise<GeolocationPosition> {
  if (!isGeolocationSupported()) {
    return Promise.reject(
      new GeolocationError(
        "unsupported",
        "Location is not supported in this browser. Enter your address manually.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(
              new GeolocationError(
                "denied",
                "Location permission was denied. You can still enter your address manually.",
              ),
            );
            break;
          case err.POSITION_UNAVAILABLE:
            reject(
              new GeolocationError(
                "unavailable",
                "GPS is unavailable right now. Enter your state, city, and ZIP manually.",
              ),
            );
            break;
          case err.TIMEOUT:
            reject(
              new GeolocationError(
                "timeout",
                "Finding your location took too long. Try again or enter your address manually.",
              ),
            );
            break;
          default:
            reject(
              new GeolocationError(
                "unknown",
                "Could not detect your location. Enter your address manually.",
              ),
            );
        }
      },
      { ...DEFAULT_OPTIONS, ...options },
    );
  });
}
