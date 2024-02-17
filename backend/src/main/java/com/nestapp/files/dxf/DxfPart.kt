package com.nestapp.files.dxf

import com.nestapp.files.dxf.common.RealPoint
import com.nestapp.files.dxf.reader.Entity
import com.nestapp.files.dxf.reader.Line
import com.nestapp.files.dxf.reader.LwPolyline
import com.nestapp.files.dxf.writter.parts.DXFEntity
import com.nestapp.files.dxf.writter.parts.DXFLWPolyline
import com.nestapp.files.dxf.writter.parts.DXFLine
import com.nestapp.nest.data.NestPath
import com.nestapp.nest.data.Placement

data class DxfPart(
    val entities: List<Entity>,
    val nestPath: NestPath,
    val inners: List<DxfPart> = emptyList(),
) {

    val bid: Int
        get() = nestPath.bid

    override fun toString(): String {
        return "DxfPart(entities=$entities, nestPath=$nestPath, inners=$inners)"
    }
}

data class DxfPartPlacement(
    val dxfPart: DxfPart,
    val placement: Placement,
) {
    val entities: List<Entity> = dxfPart.entities.plus(dxfPart.inners.flatMap { it.entities })
    val allNestedPath = listOf(dxfPart.nestPath).plus(dxfPart.inners.map { it.nestPath })

    fun getDXFEntities(): List<DXFEntity> {
        return entities.map { entity ->
            when (entity) {
                is LwPolyline -> getDXFLWPolyline(entity)
                is Line -> getDXFLine(entity)
                else -> throw RuntimeException("Not support entity")
            }
        }
    }

    private fun getDXFLine(line: Line): DXFLine {
        val start = RealPoint(line.xStart, line.yStart)
        val end = RealPoint(line.xEnd, line.yEnd)
        return DXFLine(start.transform(placement), end.transform(placement))
    }

    private fun getDXFLWPolyline(lwPolyline: LwPolyline): DXFLWPolyline {
        return DXFLWPolyline(
            segments = lwPolyline.segments.map { it.transform(placement) },
            closed = true
        )
    }
}
