export interface Member {
  id: string;
  name: string;
  gender: 'male' | 'female';
  generation: number;
  birthYear: string;
  deathYear: string;
  isDeceased: boolean;
  spouseId: string;
  parentId: string;
  childrenIds: string[];
  title: string;
  birthPlace: string;
  restingPlace: string;
  bio: string;
}

export interface MemorialTribute {
  id: string;
  memberId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AdminCredentials {
  username: string;
  password?: string;
}

export type ActiveTab = 'tree' | 'directory' | 'timeline' | 'memorial' | 'statistics';
