import { fishList, type FishEntry } from "@/data/fish-list";

function normalizeName(name: string) {
  return name.replace(/\s+/g, "").toLowerCase();
}

/**
 * 计算两个字符串的相似度（基于最长公共子序列）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  // 动态规划计算最长公共子序列
  const dp: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const lcs = dp[len1][len2];
  return lcs / Math.max(len1, len2);
}

/**
 * 检查是否包含关键词匹配
 */
function hasKeywordMatch(searchName: string, fishName: string): boolean {
  const searchWords = searchName.split(/[\s\u3000]+/).filter(word => word.length > 1);
  const fishWords = fishName.split(/[\s\u3000]+/).filter(word => word.length > 1);
  
  // 检查是否有任何搜索词包含在鱼名中，或鱼名包含在搜索词中
  for (const searchWord of searchWords) {
    for (const fishWord of fishWords) {
      if (searchWord.includes(fishWord) || fishWord.includes(searchWord)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 计算关键词匹配的权重分数
 */
function calculateKeywordScore(searchName: string, fishName: string): number {
  const searchWords = searchName.split(/[\s\u3000]+/).filter(word => word.length > 1);
  const fishWords = fishName.split(/[\s\u3000]+/).filter(word => word.length > 1);
  
  let score = 0;
  let totalMatches = 0;
  
  for (const searchWord of searchWords) {
    for (const fishWord of fishWords) {
      if (searchWord.includes(fishWord) || fishWord.includes(searchWord)) {
        // 完全匹配得分更高
        if (searchWord === fishWord) {
          score += 1.0;
        } else {
          // 部分匹配得分较低
          const matchLength = Math.min(searchWord.length, fishWord.length);
          const maxLength = Math.max(searchWord.length, fishWord.length);
          score += matchLength / maxLength;
        }
        totalMatches++;
      }
    }
  }
  
  // 如果有匹配，返回平均分数
  return totalMatches > 0 ? score / totalMatches : 0;
}

/**
 * 计算单字符匹配的权重分数（用于处理"鲈"等单字匹配）
 */
function calculateSingleCharScore(searchName: string, fishName: string): number {
  let score = 0;
  const searchChars = searchName.split('');
  const fishChars = fishName.split('');
  
  // 特殊处理：如果搜索词包含"鲈"，优先匹配包含"鲈"的鱼名
  if (searchName.includes('鲈') && fishName.includes('鲈')) {
    return 0.8; // 高权重匹配
  }
  
  for (const searchChar of searchChars) {
    if (fishChars.includes(searchChar)) {
      // 根据字符的重要性给予不同权重
      if (searchChar === '鲈' || searchChar === '鱼') {
        score += 0.5; // 重要字符给予更高权重
      } else {
        score += 0.2; // 其他字符给予较低权重
      }
    }
  }
  
  return Math.min(score, 1.0);
}

/**
 * 模糊匹配鱼类
 */
export function findFishByName(name: string): FishEntry | undefined {
  const normalized = normalizeName(name);
  
  // 首先尝试精确匹配
  let exactMatch = fishList.find((fish) => {
    if (normalizeName(fish.name_cn) === normalized) return true;
    return normalizeName(fish.name_lat) === normalized;
  });
  
  if (exactMatch) return exactMatch;
  
  // 如果没有精确匹配，尝试模糊匹配
  const candidates: Array<{ fish: FishEntry; score: number; type: 'similarity' | 'keyword' }> = [];
  
  for (const fish of fishList) {
    const fishNameCn = normalizeName(fish.name_cn);
    const fishNameLat = normalizeName(fish.name_lat);
    
    // 计算相似度
    const similarityCn = calculateSimilarity(normalized, fishNameCn);
    const similarityLat = calculateSimilarity(normalized, fishNameLat);
    const maxSimilarity = Math.max(similarityCn, similarityLat);
    
    // 计算关键词匹配分数
    const keywordScoreCn = calculateKeywordScore(name, fish.name_cn);
    const keywordScoreLat = calculateKeywordScore(name, fish.name_lat);
    const maxKeywordScore = Math.max(keywordScoreCn, keywordScoreLat);
    const hasKeywordMatchResult = maxKeywordScore > 0;
    
    // 计算单字符匹配分数
    const singleCharScoreCn = calculateSingleCharScore(name, fish.name_cn);
    const singleCharScoreLat = calculateSingleCharScore(name, fish.name_lat);
    const maxSingleCharScore = Math.max(singleCharScoreCn, singleCharScoreLat);
    
    // 如果相似度超过阈值或有关键词匹配，加入候选
    if (maxSimilarity >= 0.3 || hasKeywordMatchResult || maxSingleCharScore >= 0.3) {
      // 关键词匹配优先，使用更高的分数
      let finalScore = maxSimilarity;
      
      if (hasKeywordMatchResult) {
        finalScore = Math.max(maxKeywordScore + 0.5, maxSimilarity);
      } else if (maxSingleCharScore >= 0.3) {
        finalScore = Math.max(maxSingleCharScore, maxSimilarity);
      }
        
      candidates.push({
        fish,
        score: finalScore,
        type: hasKeywordMatchResult ? 'keyword' : 'similarity'
      });
    }
  }
  
  // 按分数排序，优先关键词匹配，然后按相似度排序
  candidates.sort((a, b) => {
    if (a.type === 'keyword' && b.type !== 'keyword') return -1;
    if (b.type === 'keyword' && a.type !== 'keyword') return 1;
    return b.score - a.score;
  });
  
  // 返回最佳匹配（如果分数足够高）
  const bestMatch = candidates[0];
  if (bestMatch && bestMatch.score >= 0.3) {
    return bestMatch.fish;
  }
  
  return undefined;
}
