from ezdxf.addons.drawing import svg, layout
from xml.etree import ElementTree as ET
from ezdxf import bbox
from ezdxf.addons.drawing import RenderContext, Frontend, layout
from ezdxf.addons.drawing import Frontend, RenderContext, svg, layout, config

class SVGRenderBackendWithHandle(svg.SVGRenderBackend):
    def add_strokes(self, d: str, properties):
        if not d:
            return
        element = ET.SubElement(self.entities, "path", d=d)
        stroke_width = self.resolve_stroke_width(properties.lineweight)
        stroke_color, stroke_opacity = self.resolve_color(properties.color)
        cls = self.styles.get_class(
            stroke=stroke_color,
            stroke_width=stroke_width,
            stroke_opacity=stroke_opacity,
        )
        element.set("class", cls)
        if hasattr(properties, 'handle') and properties.handle:
            element.set("data-dxf-handle", properties.handle)

    def add_filling(self, d: str, properties):
        if not d:
            return
        element = ET.SubElement(self.entities, "path", d=d)
        fill_color, fill_opacity = self.resolve_color(properties.color)
        cls = self.styles.get_class(fill=fill_color, fill_opacity=fill_opacity)
        element.set("class", cls)
        if hasattr(properties, 'handle') and properties.handle:
            element.set("data-dxf-handle", properties.handle)

class SVGBackendWithHandle(svg.SVGBackend):
    @staticmethod
    def make_backend(page: layout.Page, settings: layout.Settings):
        return SVGRenderBackendWithHandle(page, settings) 
    
    
def create_svg_from_doc(doc, max_flattening_distance):
    msp = doc.modelspace()
    doc_bbox = bbox.extents(msp)

    drawing_width = doc_bbox.extmax[0] - doc_bbox.extmin[0]
    drawing_height = doc_bbox.extmax[1] - doc_bbox.extmin[1]

    context = RenderContext(doc)
    backend = SVGBackendWithHandle()

    cfg = config.Configuration(
        background_policy=config.BackgroundPolicy.OFF,
        color_policy=config.ColorPolicy.BLACK,
        max_flattening_distance=max_flattening_distance,
        lineweight_policy=config.LineweightPolicy.ABSOLUTE,
        lineweight_scaling=2.0
    )
    frontend = Frontend(context, backend, cfg)

    frontend.draw_layout(msp, finalize=True)

    page = layout.Page(drawing_width, drawing_height,
                       layout.Units.mm, margins=layout.Margins.all(8))

    svg_string = backend.get_string(page)
    return svg_string