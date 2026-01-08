import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://www.leaplearners.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/library/",
          "/homework/",
          "/messages/",
          "/sessions/",
          "/meet/",
          "/take-quiz/",
          "/quiz/",
          "/videos-quiz/",
          "/auth/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/library/",
          "/homework/",
          "/messages/",
          "/sessions/",
          "/meet/",
          "/take-quiz/",
          "/quiz/",
          "/videos-quiz/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

