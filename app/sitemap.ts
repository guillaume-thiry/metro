import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://metro.guillaumethiry.com";
  return [
    { url: base, priority: 1 },
    { url: `${base}/tournament`, priority: 0.8 },
    { url: `${base}/play?mode=complete-the-line&amp;difficulty=easy`, priority: 0.6 },
    { url: `${base}/play?mode=complete-the-line&amp;difficulty=medium`, priority: 0.6 },
    { url: `${base}/play?mode=complete-the-line&amp;difficulty=hard`, priority: 0.6 },
    { url: `${base}/play?mode=name-to-lines&amp;difficulty=easy`, priority: 0.6 },
    { url: `${base}/play?mode=name-to-lines&amp;difficulty=medium`, priority: 0.6 },
    { url: `${base}/play?mode=name-to-lines&amp;difficulty=hard`, priority: 0.6 },
  ];
}
