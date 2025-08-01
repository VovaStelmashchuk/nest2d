import { connectDB } from "~/server/db/mongo"; 

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId || "anonymous";

  const db = await connectDB();
  const userProjects = await db
    .collection("projects")
    .find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .project({ slug: 1, name: 1, createdAt: 1 })
    .toArray();

  const queueList = await db
    .collection("nesting_jobs")
    .find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .project({ projectSlug: 1 })
    .toArray();

  const uiProjects = mapProject(userProjects, queueList);

  return {
    queueList: queueList,
    projects: uiProjects,
  };
});

const mapProject = (projects, queueList) => {
  return projects.map((project) => {
    const resultsLength = queueList.filter((queueItem) => {
      return queueItem.projectSlug === project.slug;
    }).length;

    return {
      slug: project.slug,
      name: project.name,
      createdAt: project.createdAt,
      results: resultsLength,
    };
  });
};
