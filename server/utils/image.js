export async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await $fetch(new URL(imageUrl), {
      responseType: "arrayBuffer",
    });
    const base64 = Buffer.from(response).toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error downloading image:", error);
    throw new Error("Error downloading image:", error);
  }
}
