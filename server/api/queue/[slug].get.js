export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  console.log(`GET ${slug}`);

  return {
    test: 1,
  };
});
