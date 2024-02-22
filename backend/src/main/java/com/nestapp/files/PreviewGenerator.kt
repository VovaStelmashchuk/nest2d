package com.nestapp.files

import com.nestapp.files.dxf.DxfWriter
import com.nestapp.files.svg.SvgWriter
import java.io.File

class PreviewGenerator {

    companion object {
        private const val DXF_TO_SVG_TOLERANCE = 0.01
    }

    private val dxfWriter = DxfWriter()
    private val svgWriter = SvgWriter()

    fun convertDxfToSvg(dxfFile: File, svgFile: File) {
        /*val dxfParts = dxfApi.readFile(dxfFile, DXF_TO_SVG_TOLERANCE)

        svgWriter.writeDxfPathsToSvg(
            dxfParts,
            svgFile,
        )*/
    }
}
