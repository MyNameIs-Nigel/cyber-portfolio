export const FS_SCHEMA_VERSION = 1;
export const STORAGE_KEY = `portfolio-shell-fs:v${FS_SCHEMA_VERSION}`;

export const HOME = "/home/guest";
export const HOSTNAME = "portfolio";
export const USER = "guest";

export const MAX_INPUT_LEN = 2_000;
export const MAX_EXPANDED_LEN = 8_000;
export const MAX_PIPE_SEGMENTS = 16;
export const MAX_ARG_COUNT = 256;
export const MAX_FILE_BYTES = 16 * 1024;
export const MAX_TOTAL_BYTES = 256 * 1024;
export const MAX_NODES = 200;
export const MAX_DEPTH = 16;
export const MAX_NAME_LEN = 255;
export const MAX_PATH_LEN = 1_024;
export const MAX_VARS = 64;
export const MAX_VAR_LEN = 4 * 1024;
export const MAX_SCROLLBACK_LINES = 1_000;
export const MAX_LINE_RENDER_LEN = 4_000;
export const MAX_HISTORY = 200;

export const RESERVED_NAMES = new Set(["__proto__", "constructor", "prototype"]);

/** Case-insensitive content/name blocklist — extend as needed. */
export const BLACKLIST: readonly string[] = ["blockedword"];

export const SHELL_MOBILE_DISMISS_KEY = "portfolio-shell-mobile-warning-dismissed";
