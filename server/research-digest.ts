/**
 * Research Digest - 研究摘要模块
 */

export interface Digest {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
}

export async function fetchAllDigests(): Promise<Digest[]> {
  return [];
}
