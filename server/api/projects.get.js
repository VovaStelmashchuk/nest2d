import { defineEventHandler } from "h3";

export default defineEventHandler(async (_) => {
  const items = [
    {
      id: "1",
      imageUrl: "https://placehold.co/600x400",
      title: "Sample Project 1",
    },
    {
      id: "2",
      imageUrl: "https://placehold.co/600x400",
      title: "Sample 2",
    },
    {
      id: "3",
      imageUrl: "https://placehold.co/600x400",
      title: "Sample Project 3",
    },
  ];

  return items;
});
