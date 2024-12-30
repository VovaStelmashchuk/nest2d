export function getDxfArray(fields) {
  return fields.map((field) => {
    const dxfBuffer = field.data;
    if (!dxfBuffer) {
      throw createError({
        statusCode: 400,
        message: "DXF file is required.",
      });
    }

    const dxfString = dxfBuffer.toString();

    return {
      filename: field.filename,
      data: dxfString,
    };
  });
}
