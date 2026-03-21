declare module 'yt-search' {
  export interface YTSearchVideo {
    videoId?: string;
    title?: string;
    url?: string;
    timestamp?: string;
    views?: number;
    ago?: string;
    author?: {
      name?: string;
      channelID?: string;
      url?: string;
    };
  }

  export interface YTSearchResult {
    videos?: YTSearchVideo[];
  }

  type YTSearch = (query: string) => Promise<YTSearchResult>;

  const ytSearch: YTSearch;
  export default ytSearch;
}
