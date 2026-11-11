export interface UserLike {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
}

/**
 * Robustly matches an expense participant, member, or friend against the current logged-in user.
 * Matches by:
 * 1. Exact userId / id equality
 * 2. Case-insensitive email equality
 * 3. Normalized phone number equality
 * 4. Case-insensitive name equality (e.g. "Kd" === "KD")
 */
export function isUserMatch(
  target?: UserLike | null,
  current?: UserLike | null
): boolean {
  if (!target || !current) return false;

  const targetId = target.id || target.userId;
  const currentId = current.id || current.userId;

  // 1. Exact ID match
  if (targetId && currentId && targetId === currentId) {
    return true;
  }

  // 2. Email match
  if (target.email && current.email) {
    if (target.email.trim().toLowerCase() === current.email.trim().toLowerCase()) {
      return true;
    }
  }

  // 3. Phone number match
  if (target.phoneNumber && current.phoneNumber) {
    const cleanTarget = target.phoneNumber.replace(/[^0-9]/g, '');
    const cleanCurrent = current.phoneNumber.replace(/[^0-9]/g, '');
    if (cleanTarget && cleanCurrent && cleanTarget === cleanCurrent) {
      return true;
    }
  }

  // 4. Case-insensitive Name match (e.g., "Kd" matches "KD")
  if (target.name && current.name) {
    const tName = target.name.trim().toLowerCase();
    const cName = current.name.trim().toLowerCase();
    if (tName === cName) {
      return true;
    }
  }

  return false;
}

