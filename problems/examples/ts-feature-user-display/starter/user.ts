export interface User {
  firstName: string;
  lastName: string;
  nickName?: string;
}

export function formatDisplayName(user: User): string {
  // TODO: nickNameがあればそれを使い、なければ firstName + " " + lastName を返す
  return "";
}
