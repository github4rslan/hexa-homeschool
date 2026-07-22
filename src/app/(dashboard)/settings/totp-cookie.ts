/**
 * Short-lived httpOnly cookie that carries freshly-minted TOTP recovery codes
 * from the confirm action to the one-time settings display. Not a "use server"
 * module, so it can export this constant to both the action and the page.
 */
export const TOTP_RECOVERY_COOKIE = "hexa_totp_recovery";
